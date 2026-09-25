#!/usr/bin/env python3
"""
seo_notifier.py — fernsehheute.de
Standalone SEO notifier: Google Indexing API, Google URL Inspection,
Google Search Analytics, IndexNow, WebSub.

Run after EPG/TMDB pipeline, before Cloudflare Pages rebuild.
"""

import json
import logging
import os
import time
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import quote

import requests
from dotenv import load_dotenv

load_dotenv()

# ──────────────────────────────────────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%dT%H:%M:%S',
)
logger = logging.getLogger('seo_notifier')

# ──────────────────────────────────────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────────────────────────────────────
SITE_URL = os.getenv('SITE_URL', 'https://fernsehheute.de').rstrip('/')
TIMEZONE = timezone.utc  # all timestamps in UTC

# Google Indexing API
GOOGLE_INDEXING_ENABLED = os.getenv('GOOGLE_INDEXING_ENABLED', '1') in ('1', 'true', 'yes', 'on')
GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON = os.getenv('GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON', '').strip()
GOOGLE_INDEXING_SERVICE_ACCOUNT_FILE = os.getenv('GOOGLE_INDEXING_SERVICE_ACCOUNT_FILE', '').strip()
GOOGLE_INDEXING_ENDPOINT = 'https://indexing.googleapis.com/v3/urlNotifications:publish'
GOOGLE_INDEXING_SCOPES = ['https://www.googleapis.com/auth/indexing']
GOOGLE_INDEXING_DAILY_BUDGET = max(1, int(os.getenv('GOOGLE_INDEXING_DAILY_BUDGET', '50')))
GOOGLE_INDEXING_TIMEOUT = int(os.getenv('GOOGLE_INDEXING_TIMEOUT', '20'))
GOOGLE_INDEXING_REQUEST_DELAY_MS = max(0, int(os.getenv('GOOGLE_INDEXING_REQUEST_DELAY_MS', '250')))
GOOGLE_INDEXING_MAX_RETRIES = max(1, int(os.getenv('GOOGLE_INDEXING_MAX_RETRIES', '3')))
GOOGLE_INDEXING_URL_TYPE = 'URL_UPDATED'

# Google URL Inspection
GOOGLE_URL_INSPECTION_ENABLED = os.getenv('GOOGLE_URL_INSPECTION_ENABLED', '1') in ('1', 'true', 'yes', 'on')
GOOGLE_URL_INSPECTION_SITE_URL = os.getenv('GOOGLE_URL_INSPECTION_SITE_URL', SITE_URL + '/').rstrip('/') + '/'
GOOGLE_URL_INSPECTION_ENDPOINT = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect'
GOOGLE_URL_INSPECTION_SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly']
GOOGLE_URL_INSPECTION_TIMEOUT = int(os.getenv('GOOGLE_URL_INSPECTION_TIMEOUT', '25'))
GOOGLE_URL_INSPECTION_LANGUAGE_CODE = os.getenv('GOOGLE_URL_INSPECTION_LANGUAGE_CODE', 'de-DE')
GOOGLE_URL_INSPECTION_MAX_URLS = max(1, int(os.getenv('GOOGLE_URL_INSPECTION_MAX_URLS', '15')))

# Google Search Analytics
GOOGLE_SEARCH_ANALYTICS_ENABLED = os.getenv('GOOGLE_SEARCH_ANALYTICS_ENABLED', '1') in ('1', 'true', 'yes', 'on')
GOOGLE_SEARCH_ANALYTICS_TIMEOUT = int(os.getenv('GOOGLE_SEARCH_ANALYTICS_TIMEOUT', '30'))
GOOGLE_SEARCH_ANALYTICS_DAYS = max(7, int(os.getenv('GOOGLE_SEARCH_ANALYTICS_DAYS', '14')))
GOOGLE_SEARCH_ANALYTICS_DELAY_DAYS = max(0, int(os.getenv('GOOGLE_SEARCH_ANALYTICS_DELAY_DAYS', '2')))
GOOGLE_SEARCH_ANALYTICS_TOP_QUERIES = max(5, int(os.getenv('GOOGLE_SEARCH_ANALYTICS_TOP_QUERIES', '20')))

# IndexNow
INDEXNOW_ENABLED = os.getenv('INDEXNOW_ENABLED', '1') in ('1', 'true', 'yes', 'on')
INDEXNOW_KEY = os.getenv('INDEXNOW_KEY', '').strip()
INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'
INDEXNOW_BATCH_SIZE = max(1, min(10000, int(os.getenv('INDEXNOW_BATCH_SIZE', '25'))))
INDEXNOW_TIMEOUT = int(os.getenv('INDEXNOW_TIMEOUT', '20'))
INDEXNOW_MAX_RETRIES = max(1, int(os.getenv('INDEXNOW_MAX_RETRIES', '3')))
INDEXNOW_REQUEST_DELAY_MS = max(0, int(os.getenv('INDEXNOW_REQUEST_DELAY_MS', '250')))

# WebSub
WEBSUB_ENABLED = os.getenv('WEBSUB_ENABLED', '1') in ('1', 'true', 'yes', 'on')
WEBSUB_HUB_URLS = [
    u.strip() for u in os.getenv(
        'WEBSUB_HUB_URLS',
        'https://pubsubhubbub.appspot.com/,https://push.superfeedr.com',
    ).split(',') if u.strip()
]
WEBSUB_TIMEOUT = int(os.getenv('WEBSUB_TIMEOUT', '20'))
WEBSUB_TOPIC_BATCH_SIZE = max(1, int(os.getenv('WEBSUB_TOPIC_BATCH_SIZE', '25')))
WEBSUB_REQUEST_DELAY_MS = max(0, int(os.getenv('WEBSUB_REQUEST_DELAY_MS', '500')))
WEBSUB_HUB_DELAY_MS = max(0, int(os.getenv('WEBSUB_HUB_DELAY_MS', '1000')))
WEBSUB_MAX_RETRIES = max(1, int(os.getenv('WEBSUB_MAX_RETRIES', '3')))

# Paths
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.getenv(
    'PUBLIC_DIR',
    os.path.abspath(os.path.join(_SCRIPT_DIR, '../../public')),
)
SEO_STATE_DIR = os.path.join(_SCRIPT_DIR, 'seo_state')
GOOGLE_INDEXING_STATE_PATH = os.path.join(SEO_STATE_DIR, 'google_indexing_state.json')
SEO_DATA_DIR = os.path.join(PUBLIC_DIR, 'seo-data')

# Short-tail priority paths (ordered: short-tail first)
SHORT_TAIL_PATHS = [
    '/', '/morgen/', '/film-heute-abend/', '/serien-heute-abend/', '/sport-heute-abend/',
    '/zdf/', '/rtl/', '/das-erste/', '/sat1/', '/prosieben/', '/vox/', '/rtl2/', '/kabel-eins/',
    '/sixx/', '/super-rtl/', '/nitro/', '/tele5/', '/zdf-neo/', '/zdfinfo/', '/3sat/', '/arte/',
    '/phoenix/', '/one/', '/sport1/', '/dmax/', '/n-tv/', '/welt/', '/tagesschau24/', '/kika/',
]


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def build_absolute_urls(paths: List[str]) -> List[str]:
    """Convert path list to absolute URLs."""
    result = []
    for p in paths:
        p = p if p.startswith('/') else '/' + p
        # Ensure trailing slash for non-root paths
        if p != '/' and not p.endswith('/'):
            p += '/'
        result.append(SITE_URL + p)
    return result


def get_all_sitemap_urls() -> List[str]:
    """Extract all valid canonical URLs from local sitemap-0.xml or remote."""
    import re
    possible_paths = [
        os.path.join(PUBLIC_DIR, 'sitemap-0.xml'),
        os.path.join(_SCRIPT_DIR, '../../dist/sitemap-0.xml'),
        os.path.join(_SCRIPT_DIR, '../../public/sitemap-0.xml'),
    ]
    for sp in possible_paths:
        if os.path.exists(sp):
            try:
                with open(sp, 'r', encoding='utf-8') as f:
                    content = f.read()
                matches = re.findall(r'<loc>(.*?)</loc>', content)
                if matches:
                    urls = [m.strip() for m in matches if m.strip().startswith(SITE_URL)]
                    if urls:
                        logger.info(f'Loaded {len(urls)} URLs from sitemap at {sp}')
                        return sorted(list(set(urls)))
            except Exception as e:
                logger.warning(f'Could not parse sitemap at {sp}: {e}')

    # Try fetching remote sitemap if local not found
    try:
        remote_url = f'{SITE_URL}/sitemap-0.xml'
        resp = requests.get(remote_url, timeout=10)
        if resp.status_code == 200:
            matches = re.findall(r'<loc>(.*?)</loc>', resp.text)
            if matches:
                urls = [m.strip() for m in matches if m.strip().startswith(SITE_URL)]
                if urls:
                    logger.info(f'Loaded {len(urls)} URLs from remote sitemap')
                    return sorted(list(set(urls)))
    except Exception as e:
        logger.warning(f'Could not fetch remote sitemap: {e}')

    return build_absolute_urls(SHORT_TAIL_PATHS)


def get_site_host() -> str:
    from urllib.parse import urlparse
    return urlparse(SITE_URL).netloc


def chunked(lst: List, n: int) -> List[List]:
    for i in range(0, len(lst), n):
        yield lst[i:i + n]


def now_iso() -> str:
    return datetime.now(TIMEZONE).isoformat()


def now_date() -> date:
    return datetime.now(TIMEZONE).date()


def _load_google_indexing_state() -> Dict[str, Any]:
    os.makedirs(SEO_STATE_DIR, exist_ok=True)
    if os.path.exists(GOOGLE_INDEXING_STATE_PATH):
        try:
            with open(GOOGLE_INDEXING_STATE_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f'Failed to load indexing state: {e}')
    return {}


def _save_google_indexing_state(state: Dict[str, Any]) -> None:
    os.makedirs(SEO_STATE_DIR, exist_ok=True)
    with open(GOOGLE_INDEXING_STATE_PATH, 'w', encoding='utf-8') as f:
        json.dump(state, f, ensure_ascii=False, indent=2)


def post_with_backoff(
    url: str,
    *,
    max_retries: int,
    timeout: int,
    retry_statuses: Tuple[int, ...] = (429, 500, 502, 503, 504),
    delay_ms: int = 0,
    **kwargs,
) -> requests.Response:
    last_response: Optional[requests.Response] = None
    last_exception: Optional[Exception] = None
    for attempt in range(max_retries):
        if delay_ms > 0 and attempt > 0:
            time.sleep(delay_ms / 1000)
        try:
            response = requests.post(url, timeout=timeout, **kwargs)
            last_response = response
            last_exception = None
            if response.status_code not in retry_statuses:
                return response
            retry_after = response.headers.get('Retry-After')
            if retry_after:
                try:
                    time.sleep(max(0, float(retry_after)))
                    continue
                except Exception:
                    pass
        except requests.RequestException as exc:
            last_exception = exc
        sleep_seconds = min(20.0, 0.8 * (2 ** attempt))
        time.sleep(sleep_seconds)

    if last_response is not None:
        return last_response
    if last_exception is not None:
        raise last_exception
    return requests.post(url, timeout=timeout, **kwargs)


# ──────────────────────────────────────────────────────────────────────────────
# Google Auth sessions
# ──────────────────────────────────────────────────────────────────────────────

def _load_service_account_info() -> Optional[Dict]:
    """Load service account JSON from env or file."""
    if GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON:
        try:
            return json.loads(GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON)
        except Exception as e:
            raise RuntimeError(f'Invalid GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON: {e}')
    if GOOGLE_INDEXING_SERVICE_ACCOUNT_FILE and os.path.exists(GOOGLE_INDEXING_SERVICE_ACCOUNT_FILE):
        with open(GOOGLE_INDEXING_SERVICE_ACCOUNT_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None


def get_google_indexing_session():
    """Return an AuthorizedSession for Google Indexing API."""
    try:
        from google.oauth2 import service_account
        from google.auth.transport.requests import AuthorizedSession
    except ImportError as e:
        raise RuntimeError('google-auth not installed; add google-auth and google-auth-httplib2 to requirements.txt') from e

    info = _load_service_account_info()
    if info is None:
        raise RuntimeError('Google Indexing API enabled but no service account configured')
    credentials = service_account.Credentials.from_service_account_info(info, scopes=GOOGLE_INDEXING_SCOPES)
    return AuthorizedSession(credentials)


def get_google_search_console_session():
    """Return an AuthorizedSession for Google Search Console APIs (URL Inspection + Analytics)."""
    try:
        from google.oauth2 import service_account
        from google.auth.transport.requests import AuthorizedSession
    except ImportError as e:
        raise RuntimeError('google-auth not installed') from e

    info = _load_service_account_info()
    if info is None:
        raise RuntimeError('GSC API enabled but no service account configured')
    credentials = service_account.Credentials.from_service_account_info(
        info, scopes=GOOGLE_URL_INSPECTION_SCOPES
    )
    return AuthorizedSession(credentials)


# ──────────────────────────────────────────────────────────────────────────────
# 1. Google Indexing API
# ──────────────────────────────────────────────────────────────────────────────

def submit_google_indexing(urls: List[str]) -> None:
    """Submit URLs to Google Indexing API, respecting daily budget."""
    if not GOOGLE_INDEXING_ENABLED:
        logger.info('Google Indexing API disabled; skipping')
        return
    if not urls:
        logger.info('No URLs to notify via Google Indexing API')
        return

    try:
        session = get_google_indexing_session()
    except RuntimeError as e:
        logger.error(f'Google Indexing API: session error — {e}')
        return

    state = _load_google_indexing_state()
    today_key = now_date().isoformat()
    if state.get('date') != today_key:
        state = {'date': today_key, 'sent_urls': [], 'count': 0}

    sent_today = list(state.get('sent_urls') or [])
    sent_today_set = set(str(u) for u in sent_today)
    remaining_budget = max(0, GOOGLE_INDEXING_DAILY_BUDGET - int(state.get('count') or 0))
    if remaining_budget <= 0:
        logger.info('Google Indexing API daily budget reached; skipping')
        return

    queued = [u for u in urls if u not in sent_today_set][:remaining_budget]
    if not queued:
        logger.info('Google Indexing API: no new URLs to notify today')
        return

    notified = 0
    for i, url in enumerate(queued):
        payload = {'url': url, 'type': GOOGLE_INDEXING_URL_TYPE}
        last_error: Optional[str] = None
        response = None
        for attempt in range(GOOGLE_INDEXING_MAX_RETRIES):
            if attempt > 0:
                time.sleep(min(20.0, 0.8 * (2 ** (attempt - 1))))
            try:
                response = session.post(
                    GOOGLE_INDEXING_ENDPOINT,
                    json=payload,
                    timeout=GOOGLE_INDEXING_TIMEOUT,
                )
                if response.status_code in (200, 202):
                    break
                last_error = f'{response.status_code}: {response.text[:400]}'
                if response.status_code not in (429, 500, 502, 503, 504):
                    break
            except Exception as e:
                last_error = str(e)

        if response is None or response.status_code not in (200, 202):
            logger.warning(f'Google Indexing API rejected {url}: {last_error or "no response"}')
            # Continue with other URLs, don't abort
            continue

        notified += 1
        sent_today.append(url)
        state['sent_urls'] = sent_today
        state['count'] = int(state.get('count') or 0) + 1
        _save_google_indexing_state(state)
        logger.info(f'  [Indexing] Submitted: {url}')
        if GOOGLE_INDEXING_REQUEST_DELAY_MS > 0 and i < len(queued) - 1:
            time.sleep(GOOGLE_INDEXING_REQUEST_DELAY_MS / 1000)

    logger.info(f'Google Indexing API: notified {notified}/{len(queued)} URLs')


# ──────────────────────────────────────────────────────────────────────────────
# 2. Google URL Inspection API
# ──────────────────────────────────────────────────────────────────────────────

def run_google_url_inspection(urls: List[str]) -> Optional[str]:
    """Inspect up to GOOGLE_URL_INSPECTION_MAX_URLS URLs and write report JSON."""
    if not GOOGLE_URL_INSPECTION_ENABLED:
        logger.info('Google URL Inspection disabled; skipping')
        return None
    if not urls:
        logger.info('No URLs for URL Inspection')
        return None

    try:
        session = get_google_search_console_session()
    except RuntimeError as e:
        logger.error(f'Google URL Inspection: session error — {e}')
        return None

    inspection_urls = urls[:GOOGLE_URL_INSPECTION_MAX_URLS]
    inspected_at = now_iso()
    results: List[Dict[str, Any]] = []

    for url in inspection_urls:
        payload = {
            'inspectionUrl': url,
            'siteUrl': GOOGLE_URL_INSPECTION_SITE_URL,
            'languageCode': GOOGLE_URL_INSPECTION_LANGUAGE_CODE,
        }
        try:
            response = session.post(
                GOOGLE_URL_INSPECTION_ENDPOINT,
                json=payload,
                timeout=GOOGLE_URL_INSPECTION_TIMEOUT,
            )
            if response.status_code != 200:
                raise RuntimeError(f'{response.status_code}: {response.text[:400]}')
            data = response.json()
            inspection = data.get('inspectionResult') or {}
            index_status = inspection.get('indexStatusResult') or {}
            mobile = inspection.get('mobileUsabilityResult') or {}
            rich = inspection.get('richResultsResult') or {}

            verdict = index_status.get('verdict')
            results.append({
                'url': url,
                'status': 'ok',
                'verdict': verdict,
                'coverageState': index_status.get('coverageState'),
                'indexingState': index_status.get('indexingState'),
                'lastCrawlTime': index_status.get('lastCrawlTime'),
                'pageFetchState': index_status.get('pageFetchState'),
                'robotsTxtState': index_status.get('robotsTxtState'),
                'googleCanonical': index_status.get('googleCanonical'),
                'userCanonical': index_status.get('userCanonical'),
                'crawledAs': index_status.get('crawledAs'),
                'inspectionResultLink': inspection.get('inspectionResultLink'),
                'mobileUsabilityVerdict': mobile.get('verdict'),
                'richResultsVerdict': rich.get('verdict'),
            })
            logger.info(f'  [Inspection] {url} → {verdict}')
        except Exception as e:
            logger.warning(f'  [Inspection] Error for {url}: {e}')
            results.append({
                'url': url,
                'status': 'error',
                'error': str(e),
                'verdict': None,
                'coverageState': None,
                'lastCrawlTime': None,
                'inspectionResultLink': None,
                'mobileUsabilityVerdict': None,
                'richResultsVerdict': None,
            })
        # Rate limit: 600/min = 10/sec → 150ms between calls
        time.sleep(0.2)

    pass_count = sum(1 for r in results if r.get('verdict') == 'PASS')
    error_count = sum(1 for r in results if r.get('status') == 'error')
    not_indexed = sum(1 for r in results if r.get('verdict') not in ('PASS', None) or (r.get('status') == 'ok' and r.get('verdict') != 'PASS'))

    payload = {
        'ok': True,
        'generatedAt': inspected_at,
        'siteUrl': GOOGLE_URL_INSPECTION_SITE_URL,
        'source': 'Google Search Console URL Inspection API',
        'summary': {
            'total': len(results),
            'pass': pass_count,
            'notIndexed': not_indexed,
            'errors': error_count,
        },
        'results': results,
    }

    os.makedirs(SEO_DATA_DIR, exist_ok=True)
    report_path = os.path.join(SEO_DATA_DIR, 'url-inspection-report.json')
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write('\n')
    logger.info(f'URL Inspection report written: {report_path} ({len(results)} URLs, {pass_count} PASS)')
    return report_path


# ──────────────────────────────────────────────────────────────────────────────
# 3. Google Search Analytics
# ──────────────────────────────────────────────────────────────────────────────

def _gsc_analytics_endpoint() -> str:
    return (
        'https://www.googleapis.com/webmasters/v3/sites/'
        + quote(GOOGLE_URL_INSPECTION_SITE_URL, safe='')
        + '/searchAnalytics/query'
    )


def _search_console_query(
    session,
    *,
    start_date: date,
    end_date: date,
    dimensions: Optional[List[str]] = None,
    row_limit: int = 100,
    filters: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    payload: Dict[str, Any] = {
        'startDate': start_date.isoformat(),
        'endDate': end_date.isoformat(),
        'rowLimit': int(row_limit),
    }
    if dimensions:
        payload['dimensions'] = dimensions
    if filters:
        payload['dimensionFilterGroups'] = [{'groupType': 'and', 'filters': filters}]

    response = session.post(
        _gsc_analytics_endpoint(),
        json=payload,
        timeout=GOOGLE_SEARCH_ANALYTICS_TIMEOUT,
    )
    if response.status_code != 200:
        raise RuntimeError(f'{response.status_code}: {response.text[:400]}')
    return response.json() or {}


def _extract_metrics(row: Optional[Dict[str, Any]]) -> Dict[str, float]:
    row = row or {}
    return {
        'clicks': float(row.get('clicks') or 0.0),
        'impressions': float(row.get('impressions') or 0.0),
        'ctr': float(row.get('ctr') or 0.0),
        'position': float(row.get('position') or 0.0),
    }


def _build_delta(current: float, previous: float) -> Optional[float]:
    if previous == 0:
        return None if current == 0 else 100.0
    return round(((current - previous) / previous) * 100.0, 2)


def run_google_search_analytics(target_urls: List[str]) -> Optional[str]:
    """Fetch GSC search analytics for the target URLs and write report JSON."""
    if not GOOGLE_SEARCH_ANALYTICS_ENABLED:
        logger.info('Google Search Analytics disabled; skipping')
        return None
    if not GOOGLE_URL_INSPECTION_ENABLED:
        logger.info('Google URL Inspection disabled (required for Search Analytics); skipping')
        return None
    if not target_urls:
        logger.info('No target URLs for Search Analytics')
        return None

    try:
        session = get_google_search_console_session()
    except RuntimeError as e:
        logger.error(f'Google Search Analytics: session error — {e}')
        return None

    end_date = (datetime.now(TIMEZONE) - timedelta(days=GOOGLE_SEARCH_ANALYTICS_DELAY_DAYS)).date()
    start_date = end_date - timedelta(days=GOOGLE_SEARCH_ANALYTICS_DAYS - 1)
    previous_end_date = start_date - timedelta(days=1)
    previous_start_date = previous_end_date - timedelta(days=GOOGLE_SEARCH_ANALYTICS_DAYS - 1)

    import re as _re
    regex_urls = [_re.escape(u) for u in target_urls]
    page_regex = f"^({'|'.join(regex_urls)})$" if regex_urls else '^$'

    try:
        current_pages_rows = _search_console_query(
            session,
            start_date=start_date,
            end_date=end_date,
            dimensions=['page'],
            row_limit=max(50, len(target_urls) + 10),
            filters=[{'dimension': 'page', 'operator': 'includingRegex', 'expression': page_regex}],
        ).get('rows') or []
    except Exception as e:
        logger.error(f'Search Analytics: failed to fetch current page data: {e}')
        current_pages_rows = []

    try:
        previous_pages_rows = _search_console_query(
            session,
            start_date=previous_start_date,
            end_date=previous_end_date,
            dimensions=['page'],
            row_limit=max(50, len(target_urls) + 10),
            filters=[{'dimension': 'page', 'operator': 'includingRegex', 'expression': page_regex}],
        ).get('rows') or []
    except Exception as e:
        logger.warning(f'Search Analytics: failed to fetch previous page data: {e}')
        previous_pages_rows = []

    try:
        current_queries_rows = _search_console_query(
            session,
            start_date=start_date,
            end_date=end_date,
            dimensions=['query'],
            row_limit=GOOGLE_SEARCH_ANALYTICS_TOP_QUERIES,
        ).get('rows') or []
    except Exception as e:
        logger.warning(f'Search Analytics: failed to fetch query data: {e}')
        current_queries_rows = []

    try:
        site_current = _extract_metrics(_search_console_query(
            session,
            start_date=start_date,
            end_date=end_date,
            row_limit=1,
        ))
    except Exception as e:
        logger.warning(f'Search Analytics: failed to fetch site totals: {e}')
        site_current = _extract_metrics(None)

    try:
        site_previous = _extract_metrics(_search_console_query(
            session,
            start_date=previous_start_date,
            end_date=previous_end_date,
            row_limit=1,
        ))
    except Exception as e:
        logger.warning(f'Search Analytics: failed to fetch previous site totals: {e}')
        site_previous = _extract_metrics(None)

    current_by_page = {str((r.get('keys') or [''])[0]): r for r in current_pages_rows}
    previous_by_page = {str((r.get('keys') or [''])[0]): r for r in previous_pages_rows}

    target_rows: List[Dict[str, Any]] = []
    for url in target_urls:
        # Derive a slug from the URL
        path = url.replace(SITE_URL, '').strip('/')
        slug = path if path else 'home'
        current_metrics = _extract_metrics(current_by_page.get(url))
        previous_metrics = _extract_metrics(previous_by_page.get(url))
        target_rows.append({
            'slug': slug,
            'url': url,
            'current': current_metrics,
            'previous': previous_metrics,
            'delta': {
                'clicks': _build_delta(current_metrics['clicks'], previous_metrics['clicks']),
                'impressions': _build_delta(current_metrics['impressions'], previous_metrics['impressions']),
                'ctr': _build_delta(current_metrics['ctr'], previous_metrics['ctr']),
                'position': round(current_metrics['position'] - previous_metrics['position'], 2)
                if previous_metrics['position'] else None,
            },
        })

    # Weighted totals
    total_impressions_cur = sum(r['current']['impressions'] for r in target_rows)
    total_impressions_prev = sum(r['previous']['impressions'] for r in target_rows)
    total_current = {
        'clicks': round(sum(r['current']['clicks'] for r in target_rows), 2),
        'impressions': round(total_impressions_cur, 2),
        'ctr': round(
            sum(r['current']['clicks'] for r in target_rows) / total_impressions_cur, 4
        ) if total_impressions_cur > 0 else 0.0,
        'position': round(
            sum(r['current']['position'] * r['current']['impressions'] for r in target_rows)
            / total_impressions_cur, 2
        ) if total_impressions_cur > 0 else 0.0,
    }
    total_previous = {
        'clicks': round(sum(r['previous']['clicks'] for r in target_rows), 2),
        'impressions': round(total_impressions_prev, 2),
        'ctr': round(
            sum(r['previous']['clicks'] for r in target_rows) / total_impressions_prev, 4
        ) if total_impressions_prev > 0 else 0.0,
        'position': round(
            sum(r['previous']['position'] * r['previous']['impressions'] for r in target_rows)
            / total_impressions_prev, 2
        ) if total_impressions_prev > 0 else 0.0,
    }

    payload = {
        'ok': True,
        'generatedAt': now_iso(),
        'siteUrl': GOOGLE_URL_INSPECTION_SITE_URL,
        'source': 'Google Search Console Search Analytics API',
        'notes': {
            'description': 'Realer Such-Traffic der verfolgten Seiten in der Search Console.',
            'windowDays': GOOGLE_SEARCH_ANALYTICS_DAYS,
            'delayDays': GOOGLE_SEARCH_ANALYTICS_DELAY_DAYS,
        },
        'period': {
            'current': {'startDate': start_date.isoformat(), 'endDate': end_date.isoformat()},
            'previous': {'startDate': previous_start_date.isoformat(), 'endDate': previous_end_date.isoformat()},
        },
        'summary': {
            'siteCurrent': site_current,
            'sitePrevious': site_previous,
            'headCurrent': total_current,
            'headPrevious': total_previous,
            'headDelta': {
                'clicks': _build_delta(total_current['clicks'], total_previous['clicks']),
                'impressions': _build_delta(total_current['impressions'], total_previous['impressions']),
                'ctr': _build_delta(total_current['ctr'], total_previous['ctr']),
                'position': round(total_current['position'] - total_previous['position'], 2)
                if total_previous['position'] else None,
            },
        },
        'topQueries': [
            {
                'query': str((r.get('keys') or [''])[0]),
                'clicks': float(r.get('clicks') or 0.0),
                'impressions': float(r.get('impressions') or 0.0),
                'ctr': float(r.get('ctr') or 0.0),
                'position': float(r.get('position') or 0.0),
            }
            for r in current_queries_rows
            if (r.get('keys') or [''])[0]
        ],
        'targets': sorted(
            target_rows,
            key=lambda item: (item['current']['clicks'], item['current']['impressions']),
            reverse=True,
        ),
    }

    os.makedirs(SEO_DATA_DIR, exist_ok=True)
    report_path = os.path.join(SEO_DATA_DIR, 'search-performance-report.json')
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write('\n')
    logger.info(f'Search Analytics report written: {report_path} ({len(target_rows)} URLs)')
    return report_path


# ──────────────────────────────────────────────────────────────────────────────
# 4. IndexNow
# ──────────────────────────────────────────────────────────────────────────────

def ensure_indexnow_key_file() -> Optional[str]:
    """Create {key}.txt file in PUBLIC_DIR and return its URL."""
    if not INDEXNOW_KEY:
        return None
    os.makedirs(PUBLIC_DIR, exist_ok=True)
    filename = f'{INDEXNOW_KEY}.txt'
    path = os.path.join(PUBLIC_DIR, filename)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(INDEXNOW_KEY)
    return f'{SITE_URL}/{filename}'


def submit_indexnow(urls: List[str]) -> None:
    """Batch-submit URLs to IndexNow."""
    if not INDEXNOW_ENABLED:
        logger.info('IndexNow disabled; skipping')
        return
    if not INDEXNOW_KEY:
        logger.info('IndexNow key missing; skipping')
        return
    if not urls:
        logger.info('No URLs to notify via IndexNow')
        return

    key_location = ensure_indexnow_key_file()
    host = get_site_host()
    total = 0

    batches = list(chunked(urls, INDEXNOW_BATCH_SIZE))
    for i, batch in enumerate(batches):
        payload: Dict[str, Any] = {
            'host': host,
            'key': INDEXNOW_KEY,
            'urlList': batch,
        }
        if key_location:
            payload['keyLocation'] = key_location

        try:
            response = post_with_backoff(
                INDEXNOW_ENDPOINT,
                json=payload,
                headers={'Content-Type': 'application/json; charset=utf-8'},
                timeout=INDEXNOW_TIMEOUT,
                max_retries=INDEXNOW_MAX_RETRIES,
                delay_ms=INDEXNOW_REQUEST_DELAY_MS,
            )
            if response.status_code not in (200, 202):
                logger.warning(f'IndexNow rejected batch {i + 1}: {response.status_code} — {response.text[:200]}')
            else:
                total += len(batch)
                logger.info(f'  [IndexNow] Batch {i + 1}/{len(batches)}: {len(batch)} URLs submitted')
        except Exception as e:
            logger.warning(f'IndexNow batch {i + 1} error: {e}')

        if INDEXNOW_REQUEST_DELAY_MS > 0 and i < len(batches) - 1:
            time.sleep(INDEXNOW_REQUEST_DELAY_MS / 1000)

    logger.info(f'IndexNow: notified {total} URLs total')


# ──────────────────────────────────────────────────────────────────────────────
# 5. WebSub
# ──────────────────────────────────────────────────────────────────────────────

def publish_websub(urls: List[str]) -> None:
    """Publish URLs to WebSub hubs."""
    if not WEBSUB_ENABLED:
        logger.info('WebSub disabled; skipping')
        return
    if not WEBSUB_HUB_URLS:
        logger.info('WebSub hub list empty; skipping')
        return
    if not urls:
        logger.info('No URLs to notify via WebSub')
        return

    # Also include sitemap
    all_topics = [f'{SITE_URL}/sitemap-index.xml'] + urls

    for hub_index, hub_url in enumerate(WEBSUB_HUB_URLS):
        hub_total = 0
        try:
            batches = list(chunked(all_topics, WEBSUB_TOPIC_BATCH_SIZE))
            for bi, batch in enumerate(batches):
                form_payload = [('hub.mode', 'publish')] + [('hub.url', u) for u in batch]
                try:
                    response = post_with_backoff(
                        hub_url,
                        data=form_payload,
                        headers={'Content-Type': 'application/x-www-form-urlencoded'},
                        timeout=WEBSUB_TIMEOUT,
                        max_retries=WEBSUB_MAX_RETRIES,
                        delay_ms=WEBSUB_REQUEST_DELAY_MS,
                    )
                    if response.status_code not in (200, 202, 204):
                        logger.warning(
                            f'WebSub hub {hub_url} rejected batch {bi + 1}: '
                            f'{response.status_code} — {response.text[:200]}'
                        )
                    else:
                        hub_total += len(batch)
                        logger.info(f'  [WebSub] {hub_url}: batch {bi + 1}/{len(batches)}, {len(batch)} topics')
                except Exception as e:
                    logger.warning(f'WebSub hub {hub_url} batch {bi + 1} error: {e}')

                if WEBSUB_REQUEST_DELAY_MS > 0 and bi < len(batches) - 1:
                    time.sleep(WEBSUB_REQUEST_DELAY_MS / 1000)

            logger.info(f'WebSub hub {hub_url}: published {hub_total} topics')
        except Exception as e:
            logger.warning(f'WebSub hub {hub_url}: error — {e}')

        if WEBSUB_HUB_DELAY_MS > 0 and hub_index < len(WEBSUB_HUB_URLS) - 1:
            time.sleep(WEBSUB_HUB_DELAY_MS / 1000)


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────

def main() -> None:
    logger.info('=' * 60)
    logger.info('SEO Notifier — fernsehheute.de')
    logger.info(f'SITE_URL: {SITE_URL}')
    logger.info(f'PUBLIC_DIR: {PUBLIC_DIR}')
    logger.info('=' * 60)

    # Build list of absolute short-tail URLs
    all_urls = build_absolute_urls(SHORT_TAIL_PATHS)
    logger.info(f'Target URLs: {len(all_urls)}')

    # Step 1: URL Inspection — identify indexed / not-indexed
    logger.info('[1/5] Google URL Inspection API')
    inspection_report_path: Optional[str] = None
    unindexed_urls: List[str] = []
    try:
        inspection_report_path = run_google_url_inspection(all_urls)
        # Identify unindexed URLs from results
        if inspection_report_path and os.path.exists(inspection_report_path):
            with open(inspection_report_path, 'r', encoding='utf-8') as f:
                insp_data = json.load(f)
            for r in insp_data.get('results') or []:
                if r.get('status') == 'ok' and r.get('verdict') != 'PASS':
                    unindexed_urls.append(r['url'])
                elif r.get('status') == 'error':
                    unindexed_urls.append(r['url'])
            logger.info(f'URL Inspection: {len(unindexed_urls)} unindexed/error URLs to re-submit')
    except Exception as e:
        logger.error(f'URL Inspection failed: {e}')

    # Step 2: Google Indexing API — only submit unindexed URLs (or all if inspection not available)
    logger.info('[2/5] Google Indexing API')
    try:
        urls_to_index = unindexed_urls if unindexed_urls else all_urls[:GOOGLE_INDEXING_DAILY_BUDGET]
        submit_google_indexing(urls_to_index)
    except Exception as e:
        logger.error(f'Google Indexing API failed: {e}')

    # Step 3: Google Search Analytics
    logger.info('[3/5] Google Search Analytics')
    try:
        run_google_search_analytics(all_urls)
    except Exception as e:
        logger.error(f'Google Search Analytics failed: {e}')

    # Step 4: IndexNow — submit ALL valid sitemap URLs
    logger.info('[4/5] IndexNow')
    try:
        sitemap_urls = get_all_sitemap_urls()
        logger.info(f'IndexNow submitting {len(sitemap_urls)} canonical URLs')
        submit_indexnow(sitemap_urls)
    except Exception as e:
        logger.error(f'IndexNow failed: {e}')

    # Step 5: WebSub — all short-tail URLs and sitemap
    logger.info('[5/5] WebSub')
    try:
        publish_websub(all_urls)
    except Exception as e:
        logger.error(f'WebSub failed: {e}')

    logger.info('=' * 60)
    logger.info('SEO Notifier complete')
    logger.info('=' * 60)


if __name__ == '__main__':
    main()
