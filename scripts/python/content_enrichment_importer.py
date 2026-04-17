#!/usr/bin/env python3
"""
Content enrichment importer for fernsehheute.de

Sprint 2 goals:
- Create/maintain enrichment rows with source + license + attribution metadata
- Add official channel website/stream links
- Enrich thin program descriptions using Wikipedia summaries (DE)
"""

import hashlib
import json
import logging
import os
import re
import sys
import time
import unicodedata
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.parse import quote, urlparse

import requests
from dotenv import load_dotenv
from postgrest import APIError
from supabase import Client, ClientOptions, create_client
from pg_adapter import create_postgres_client


# ============================================
# CONFIG
# ============================================

TIMEZONE = timezone.utc
BATCH_SIZE = 100
REQUEST_TIMEOUT = float(os.getenv('ENRICH_HTTP_TIMEOUT', '10'))
REQUEST_SLEEP_SEC = float(os.getenv('ENRICH_REQUEST_SLEEP_SEC', '0.2'))

CHANNELS_TABLE = os.getenv('SUPABASE_CHANNELS_TABLE', 'channels_de')
PROGRAMS_TABLE = os.getenv('SUPABASE_PROGRAMS_TABLE', 'programs_de')
ENRICHMENT_TABLE = os.getenv('SUPABASE_ENRICHMENT_TABLE', 'content_enrichment_de')
IMPORT_STATUS_TABLE = os.getenv('IMPORT_STATUS_TABLE', 'import_status')
IMPORT_STATUS_ID = os.getenv('ENRICH_IMPORT_STATUS_ID', 'enrichment_de')

LOOKBACK_DAYS = int(os.getenv('ENRICH_LOOKBACK_DAYS', '2'))
LOOKAHEAD_DAYS = int(os.getenv('ENRICH_LOOKAHEAD_DAYS', '2'))
MAX_PROGRAMS_PER_RUN = int(os.getenv('ENRICH_MAX_PROGRAMS', '120'))
MIN_DESCRIPTION_LEN = int(os.getenv('ENRICH_MIN_DESCRIPTION_LEN', '110'))
MIN_SUMMARY_LEN = int(os.getenv('ENRICH_MIN_SUMMARY_LEN', '120'))
MIN_CONFIDENCE = float(os.getenv('ENRICH_MIN_CONFIDENCE', '0.55'))
METADATA_TTL_DAYS = int(os.getenv('ENRICH_METADATA_TTL_DAYS', '30'))

VERIFY_LINKS = os.getenv('ENRICH_VERIFY_LINKS', '1') == '1'
CHANNEL_LINKS_FILE = os.getenv(
    'ENRICH_CHANNEL_STREAMS_FILE',
    os.path.join(os.path.dirname(__file__), 'channel_streams_official_de.json')
)

WIKIPEDIA_LANG = os.getenv('ENRICH_WIKIPEDIA_LANG', 'de')
WIKIPEDIA_API_BASE = f"https://{WIKIPEDIA_LANG}.wikipedia.org/api/rest_v1/page/summary"
WIKIPEDIA_LICENSE_NAME = 'CC BY-SA 4.0'
WIKIPEDIA_LICENSE_URL = 'https://creativecommons.org/licenses/by-sa/4.0/'
WIKIPEDIA_ATTRIBUTION = 'Wikipedia contributors (CC BY-SA 4.0)'
WIKIPEDIA_USER_AGENT = os.getenv(
    'ENRICH_USER_AGENT',
    'fernsehheute-enrichment-bot/1.0 (https://fernsehheute.de; kontakt@fernsehheute.de)'
)

IMAGE_CACHE_DIR = os.getenv('ENRICH_IMAGE_CACHE_DIR', '').strip()
REPORTS_DIR = os.getenv(
    'ENRICH_REPORTS_DIR',
    os.path.join(os.path.dirname(__file__), 'reports')
)

DEFAULT_ALLOWED_DOMAINS = [
    'ardmediathek.de',
    'zdf.de',
    '3sat.de',
    'arte.tv',
    'phoenix.de',
    'kika.de',
    'mdr.de',
    'ndr.de',
    'wdr.de',
    'rbb-online.de',
    'br.de',
    'hr-fernsehen.de',
    'swrfernsehen.de',
    'rtl.de',
    'plus.rtl.de',
    'joyn.de',
    'sport1.de',
    'eurosport.de',
]
OFFICIAL_ALLOWED_DOMAINS = [
    d.strip().lower()
    for d in os.getenv('ENRICH_ALLOWED_DOMAINS', ','.join(DEFAULT_ALLOWED_DOMAINS)).split(',')
    if d.strip()
]

SUPABASE_MAX_RETRIES = int(os.getenv('SUPABASE_MAX_RETRIES', '6'))
SUPABASE_RETRY_DELAY = float(os.getenv('SUPABASE_RETRY_DELAY', '2'))


# ============================================
# LOGGING
# ============================================

def setup_logging() -> logging.Logger:
    log_file = os.getenv(
        'ENRICH_LOG_FILE',
        os.path.join(os.path.dirname(__file__), 'content_enrichment_import.log')
    )
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[logging.FileHandler(log_file), logging.StreamHandler(sys.stdout)]
    )
    return logging.getLogger(__name__)


logger = setup_logging()


# ============================================
# HELPERS
# ============================================

def normalize_text(value: str) -> str:
    value = (value or '').lower().strip()
    value = unicodedata.normalize('NFD', value)
    value = ''.join(ch for ch in value if unicodedata.category(ch) != 'Mn')
    value = re.sub(r'[^a-z0-9\s-]', ' ', value)
    value = re.sub(r'\s+', ' ', value)
    return value.strip()


def normalize_title_for_search(value: str) -> str:
    value = normalize_text(value)
    # remove episode-style tails and separators that hurt matching quality
    value = re.sub(r'\b(folge|episode|teil)\s*\d+\b', ' ', value)
    value = re.sub(r'\b(staffel|season)\s*\d+\b', ' ', value)
    value = re.sub(r'\s+-\s+.*$', '', value)
    value = re.sub(r'\s+', ' ', value).strip()
    return value


def title_match_confidence(query_title: str, page_title: str, summary: str) -> float:
    q = normalize_title_for_search(query_title)
    p = normalize_text(page_title)
    s = normalize_text(summary)
    if not q or not p:
        return 0.0

    q_tokens = {t for t in q.split(' ') if len(t) >= 3}
    p_tokens = {t for t in p.split(' ') if len(t) >= 3}
    if not q_tokens or not p_tokens:
        return 0.0

    overlap = len(q_tokens.intersection(p_tokens))
    overlap_ratio = overlap / max(len(q_tokens), 1)

    summary_hits = sum(1 for t in q_tokens if t in s)
    summary_ratio = summary_hits / max(len(q_tokens), 1)

    exact_bonus = 0.25 if q == p else 0.0
    starts_bonus = 0.1 if p.startswith(q[: min(len(q), 20)]) else 0.0
    score = (overlap_ratio * 0.55) + (summary_ratio * 0.35) + exact_bonus + starts_bonus
    return min(1.0, round(score, 3))


def hash_key(value: str) -> str:
    return hashlib.sha1(value.encode('utf-8')).hexdigest()


def now_iso() -> str:
    return datetime.now(TIMEZONE).isoformat()


def is_retryable_error(err: Exception) -> bool:
    msg = str(err)
    # Retry only transient cache/network issues, not missing-table errors (PGRST205).
    return 'PGRST002' in msg or '503' in msg


def parse_hostname(url: str) -> str:
    try:
        return (urlparse(url).hostname or '').lower().strip()
    except Exception:
        return ''


def is_allowed_domain(host: str, allowed: List[str]) -> bool:
    if not host:
        return False
    for base in allowed:
        b = (base or '').lower().strip()
        if not b:
            continue
        if host == b or host.endswith(f'.{b}'):
            return True
    return False


def execute_with_retry(request, label: str = ''):
    for attempt in range(1, SUPABASE_MAX_RETRIES + 1):
        try:
            return request.execute()
        except APIError as e:
            if not is_retryable_error(e) or attempt == SUPABASE_MAX_RETRIES:
                raise
            delay = min(60, SUPABASE_RETRY_DELAY * (2 ** (attempt - 1)))
            logger.warning(
                f"{label} failed (attempt {attempt}/{SUPABASE_MAX_RETRIES}). Retrying in {delay:.1f}s"
            )
            time.sleep(delay)


def update_import_status(supabase: Client, payload: Dict) -> None:
    try:
        execute_with_retry(
            supabase.table(IMPORT_STATUS_TABLE).upsert(payload, on_conflict='id'),
            label='import_status upsert'
        )
    except Exception as e:
        # Some PostgREST setups may reject upsert in this table; fallback to plain update.
        try:
            row_id = payload.get('id')
            if row_id:
                update_payload = {k: v for k, v in payload.items() if k != 'id'}
                execute_with_retry(
                    supabase.table(IMPORT_STATUS_TABLE).update(update_payload).eq('id', row_id),
                    label='import_status fallback update'
                )
                return
        except Exception:
            pass
        logger.warning(f"Failed to update import status ({IMPORT_STATUS_ID}): {e}")


def get_supabase_client() -> Client:
    database_url = os.getenv('DATABASE_URL')
    if database_url:
        logger.info("Using direct Postgres connection from DATABASE_URL")
        return create_postgres_client(database_url)

    url = os.getenv('SUPABASE_URL')
    key = (os.getenv('SUPABASE_SERVICE_KEY') or
           os.getenv('SUPABASE_READ_KEY') or
           os.getenv('SUPABASE_ANON_KEY') or '')
    if not url or not key:
        raise ValueError('Missing DATABASE_URL or SUPABASE_URL/SUPABASE_SERVICE_KEY')
    return create_client(url, key, options=ClientOptions(schema='public'))


def ensure_enrichment_table_exists(supabase: Client) -> None:
    try:
        execute_with_retry(supabase.table(ENRICHMENT_TABLE).select('id').limit(1), label='enrichment table check')
    except APIError as e:
        if 'does not exist' in str(e).lower() or '42p01' in str(e).lower():
            raise RuntimeError(
                f"Table '{ENRICHMENT_TABLE}' not found. Apply database/migrations/20260304_content_enrichment_de.sql first."
            ) from e
        raise


def fetch_program_candidates(supabase: Client) -> List[Dict]:
    now = datetime.now(timezone.utc)
    start_iso = (now - timedelta(days=LOOKBACK_DAYS)).isoformat()
    end_iso = (now + timedelta(days=LOOKAHEAD_DAYS)).isoformat()

    thin: List[Dict] = []
    offset = 0
    while True:
        res = execute_with_retry(
            supabase.table(PROGRAMS_TABLE)
            .select('id,title,description,channel_id,start_time,end_time')
            .gte('start_time', start_iso)
            .lte('start_time', end_iso)
            .order('start_time', desc=False)
            .range(offset, offset + 999),
            label='fetch programs'
        )
        data = getattr(res, 'data', []) or []
        if not data:
            break

        for p in data:
            desc = (p.get('description') or '').strip()
            if len(desc) < MIN_DESCRIPTION_LEN:
                thin.append(p)
                if len(thin) >= MAX_PROGRAMS_PER_RUN:
                    break

        if len(thin) >= MAX_PROGRAMS_PER_RUN:
            break

        if len(data) < 1000:
            break
        offset += 1000

    thin.sort(key=lambda row: ((row.get('description') or '').strip() != '', row.get('start_time') or ''))
    if len(thin) > MAX_PROGRAMS_PER_RUN:
        thin = thin[:MAX_PROGRAMS_PER_RUN]
    return thin


def fetch_channels(supabase: Client) -> Dict[str, Dict]:
    channels: Dict[str, Dict] = {}
    offset = 0
    while True:
        res = execute_with_retry(
            supabase.table(CHANNELS_TABLE)
            .select('channel_id,name')
            .order('channel_id', desc=False)
            .range(offset, offset + 999),
            label='fetch channels'
        )
        data = getattr(res, 'data', []) or []
        if not data:
            break
        for c in data:
            cid = (c.get('channel_id') or '').strip()
            if cid:
                channels[cid] = c
        if len(data) < 1000:
            break
        offset += 1000
    return channels


def verify_url(url: str) -> Tuple[str, float, Optional[int]]:
    if not url:
        return 'failed', 0.0, None
    if not VERIFY_LINKS:
        return 'verified', 1.0, None

    headers = {'User-Agent': WIKIPEDIA_USER_AGENT}
    try:
        r = requests.head(url, allow_redirects=True, timeout=REQUEST_TIMEOUT, headers=headers)
        if 200 <= r.status_code < 400:
            return 'verified', 1.0, r.status_code
        # Some sites block HEAD, fallback to GET
        rg = requests.get(url, allow_redirects=True, timeout=REQUEST_TIMEOUT, headers=headers, stream=True)
        if 200 <= rg.status_code < 400:
            return 'verified', 0.95, rg.status_code
        return 'failed', 0.2, rg.status_code
    except Exception:
        return 'failed', 0.1, None


def apply_policy_gates(rows: List[Dict]) -> Tuple[List[Dict], Dict]:
    """
    Enforce legal/quality policy checks.
    Non-compliant rows are preserved for audit, but marked as failed.
    """
    if not rows:
        return [], {
            'total': 0,
            'passed': 0,
            'failed': 0,
            'fail_reasons': {},
            'status_counts': {},
            'provider_counts': {},
            'type_counts': {},
        }

    gated_rows: List[Dict] = []
    fail_reasons = Counter()
    status_counts = Counter()
    provider_counts = Counter()
    type_counts = Counter()
    checked_at = now_iso()
    passed = 0
    failed = 0

    for original in rows:
        row = dict(original)
        reasons: List[str] = []
        provider = (row.get('provider') or '').strip().lower()
        enrichment_type = (row.get('enrichment_type') or '').strip().lower()
        pre_status = (row.get('verification_status') or '').strip().lower()

        license_name = (row.get('license_name') or '').strip()
        if not license_name or license_name.lower() == 'unknown':
            reasons.append('missing_license')

        attribution_required = bool(row.get('attribution_required'))
        attribution_text = (row.get('attribution_text') or '').strip()
        if attribution_required and not attribution_text:
            reasons.append('missing_attribution')

        confidence = float(row.get('confidence') or 0.0)
        if (row.get('verification_status') or '').lower() == 'verified' and confidence < MIN_CONFIDENCE:
            reasons.append('low_confidence_verified')

        link_target = (
            (row.get('stream_url') or '').strip()
            or (row.get('link_url') or '').strip()
            or (row.get('external_url') or '').strip()
        )
        if enrichment_type in ('channel_stream', 'channel_website', 'external_link'):
            if not link_target:
                reasons.append('missing_link_target')
            elif not link_target.startswith('https://'):
                reasons.append('non_https_link')

            host = parse_hostname(link_target)
            if provider == 'official' and not is_allowed_domain(host, OFFICIAL_ALLOWED_DOMAINS):
                reasons.append('domain_not_whitelisted')

        if provider == 'wikipedia':
            source_host = parse_hostname((row.get('external_url') or '').strip())
            if source_host and 'wikipedia.org' not in source_host:
                reasons.append('invalid_wikipedia_source')
            if (row.get('license_name') or '').strip() != WIKIPEDIA_LICENSE_NAME:
                reasons.append('unexpected_wikipedia_license')
            if enrichment_type in ('program_metadata', 'image') and attribution_text != WIKIPEDIA_ATTRIBUTION:
                reasons.append('unexpected_wikipedia_attribution')

        # Link check may already mark row as failed in build_* functions.
        if pre_status == 'failed' and enrichment_type in ('channel_stream', 'channel_website', 'external_link'):
            reasons.append('link_unreachable')

        payload = dict(row.get('source_payload') or {})
        payload['policy_gate'] = {
            'checked_at': checked_at,
            'passed': len(reasons) == 0,
            'reasons': reasons,
        }

        if reasons:
            for reason in reasons:
                fail_reasons[reason] += 1
            row['verification_status'] = 'failed'
            row['confidence'] = min(confidence, 0.2)

        row['source_payload'] = payload
        final_status = (row.get('verification_status') or 'unknown').lower()
        status_counts[final_status] += 1
        if final_status == 'failed':
            failed += 1
        else:
            passed += 1
        provider_counts[provider or 'unknown'] += 1
        type_counts[enrichment_type or 'unknown'] += 1
        gated_rows.append(row)

    report = {
        'total': len(rows),
        'passed': passed,
        'failed': failed,
        'fail_reasons': dict(fail_reasons),
        'status_counts': dict(status_counts),
        'provider_counts': dict(provider_counts),
        'type_counts': dict(type_counts),
    }
    return gated_rows, report


def write_quality_report(report: Dict) -> Optional[str]:
    try:
        os.makedirs(REPORTS_DIR, exist_ok=True)
        ts = datetime.now(TIMEZONE).strftime('%Y%m%d_%H%M%S')
        path = os.path.join(REPORTS_DIR, f'enrichment_quality_{ts}.json')
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        return path
    except Exception as e:
        logger.warning(f"Failed to write quality report: {e}")
        return None


def load_channel_links() -> Dict[str, Dict]:
    path = Path(CHANNEL_LINKS_FILE)
    if not path.exists():
        logger.warning(f"Channel links file not found: {path}")
        return {}
    try:
        with path.open('r', encoding='utf-8') as f:
            data = json.load(f)
        if isinstance(data, dict):
            return data
    except Exception as e:
        logger.warning(f"Failed to parse {path}: {e}")
    return {}


def maybe_cache_image(image_url: str) -> Optional[str]:
    cache_dir = IMAGE_CACHE_DIR.strip()
    if not cache_dir or not image_url:
        return None

    try:
        os.makedirs(cache_dir, exist_ok=True)
        ext = '.jpg'
        lower = image_url.lower()
        if '.png' in lower:
            ext = '.png'
        elif '.webp' in lower:
            ext = '.webp'
        elif '.svg' in lower:
            ext = '.svg'

        filename = f"{hash_key(image_url)}{ext}"
        target = os.path.join(cache_dir, filename)
        if os.path.exists(target):
            return target

        r = requests.get(
            image_url,
            timeout=REQUEST_TIMEOUT,
            headers={'User-Agent': WIKIPEDIA_USER_AGENT}
        )
        r.raise_for_status()
        with open(target, 'wb') as out:
            out.write(r.content)
        return target
    except Exception as e:
        logger.debug(f"Image cache failed for {image_url}: {e}")
        return None


def fetch_wikipedia_summary(query_title: str) -> Optional[Dict]:
    search_title = normalize_title_for_search(query_title)
    if not search_title:
        return None

    url = f"{WIKIPEDIA_API_BASE}/{quote(search_title)}"
    headers = {'User-Agent': WIKIPEDIA_USER_AGENT, 'Accept': 'application/json'}

    try:
        r = requests.get(url, timeout=REQUEST_TIMEOUT, headers=headers)
        if r.status_code == 404:
            return None
        r.raise_for_status()
        payload = r.json()
    except Exception as e:
        logger.debug(f"Wikipedia lookup failed for '{query_title}': {e}")
        return None

    if payload.get('type') == 'disambiguation':
        return None

    summary = (payload.get('extract') or '').strip()
    page_title = (payload.get('title') or '').strip()
    if len(summary) < MIN_SUMMARY_LEN or not page_title:
        return None

    confidence = title_match_confidence(query_title, page_title, summary)
    if confidence < MIN_CONFIDENCE:
        return None

    page_url = (
        payload.get('content_urls', {})
        .get('desktop', {})
        .get('page')
    )
    image_url = (payload.get('thumbnail') or {}).get('source')

    return {
        'page_id': str(payload.get('pageid') or ''),
        'title': page_title,
        'summary': summary,
        'page_url': page_url,
        'image_url': image_url,
        'confidence': confidence,
        'raw': payload,
    }


def build_channel_rows(channels: Dict[str, Dict], links: Dict[str, Dict]) -> List[Dict]:
    rows: List[Dict] = []
    ts_now = now_iso()

    for channel_id, cfg in links.items():
        if channel_id not in channels:
            continue

        website = (cfg.get('website') or '').strip()
        stream_url = (cfg.get('stream_url') or '').strip()
        label = (cfg.get('label') or 'Official link').strip()

        if website:
            status, conf, code = verify_url(website)
            rows.append({
                'entity_kind': 'channel',
                'entity_id': channel_id,
                'channel_id': channel_id,
                'provider': 'official',
                'enrichment_type': 'channel_website',
                'dedupe_key': 'official-website',
                'external_url': website,
                'link_url': website,
                'link_label': label,
                'license_name': 'owned-by-broadcaster',
                'license_url': None,
                'attribution_required': False,
                'attribution_text': None,
                'usage_scope': 'both',
                'confidence': conf,
                'verification_status': status,
                'last_verified_at': ts_now,
                'source_payload': {'http_status': code} if code else {},
            })

        if stream_url:
            status, conf, code = verify_url(stream_url)
            rows.append({
                'entity_kind': 'channel',
                'entity_id': channel_id,
                'channel_id': channel_id,
                'provider': 'official',
                'enrichment_type': 'channel_stream',
                'dedupe_key': 'official-stream',
                'external_url': stream_url,
                'stream_url': stream_url,
                'link_url': stream_url,
                'link_label': label,
                'license_name': 'owned-by-broadcaster',
                'license_url': None,
                'attribution_required': False,
                'attribution_text': None,
                'usage_scope': 'both',
                'confidence': conf,
                'verification_status': status,
                'last_verified_at': ts_now,
                'source_payload': {'http_status': code} if code else {},
            })

    return rows


def build_program_rows(programs: List[Dict]) -> List[Dict]:
    rows: List[Dict] = []
    ts_now = now_iso()
    expires = (datetime.now(TIMEZONE) + timedelta(days=METADATA_TTL_DAYS)).isoformat()

    # cache wikipedia lookups by normalized title to avoid repeated requests
    wiki_cache: Dict[str, Optional[Dict]] = {}

    for p in programs:
        program_id = p.get('id')
        channel_id = (p.get('channel_id') or '').strip()
        title = (p.get('title') or '').strip()
        if not program_id or not channel_id or not title:
            continue

        normalized_key = normalize_title_for_search(title)
        if normalized_key not in wiki_cache:
            wiki_cache[normalized_key] = fetch_wikipedia_summary(title)
            time.sleep(REQUEST_SLEEP_SEC)

        wiki = wiki_cache.get(normalized_key)
        if not wiki:
            continue

        page_id = wiki.get('page_id') or hash_key(wiki.get('title', ''))
        confidence = float(wiki.get('confidence') or 0.0)

        rows.append({
            'entity_kind': 'program',
            'entity_id': str(program_id),
            'program_id': int(program_id),
            'channel_id': channel_id,
            'provider': 'wikipedia',
            'enrichment_type': 'program_metadata',
            'dedupe_key': f'wiki:{page_id}',
            'external_id': page_id,
            'external_url': wiki.get('page_url'),
            'title': wiki.get('title'),
            'synopsis': wiki.get('summary'),
            'license_name': WIKIPEDIA_LICENSE_NAME,
            'license_url': WIKIPEDIA_LICENSE_URL,
            'attribution_required': True,
            'attribution_text': WIKIPEDIA_ATTRIBUTION,
            'usage_scope': 'editorial',
            'confidence': confidence,
            'verification_status': 'verified',
            'last_verified_at': ts_now,
            'expires_at': expires,
            'source_payload': {
                'query_title': title,
                'lang': WIKIPEDIA_LANG,
            },
        })

        image_url = (wiki.get('image_url') or '').strip()
        if image_url:
            local_image_path = maybe_cache_image(image_url)
            rows.append({
                'entity_kind': 'program',
                'entity_id': str(program_id),
                'program_id': int(program_id),
                'channel_id': channel_id,
                'provider': 'wikipedia',
                'enrichment_type': 'image',
                'dedupe_key': f'wiki-image:{page_id}',
                'external_id': page_id,
                'external_url': wiki.get('page_url'),
                'title': wiki.get('title'),
                'image_url': image_url,
                'image_local_path': local_image_path,
                'license_name': WIKIPEDIA_LICENSE_NAME,
                'license_url': WIKIPEDIA_LICENSE_URL,
                'attribution_required': True,
                'attribution_text': WIKIPEDIA_ATTRIBUTION,
                'usage_scope': 'editorial',
                'confidence': confidence,
                'verification_status': 'verified',
                'last_verified_at': ts_now,
                'expires_at': expires,
                'source_payload': {
                    'query_title': title,
                    'lang': WIKIPEDIA_LANG,
                },
            })

    return rows


def upsert_rows(supabase: Client, rows: List[Dict]) -> int:
    if not rows:
        return 0

    upserted = 0
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i:i + BATCH_SIZE]
        execute_with_retry(
            supabase.table(ENRICHMENT_TABLE).upsert(
                batch,
                on_conflict='entity_kind,entity_id,provider,enrichment_type,dedupe_key'
            ),
            label='upsert enrichment batch'
        )
        upserted += len(batch)
    return upserted


def main() -> int:
    logger.info("=" * 60)
    logger.info("Content Enrichment Importer (fernsehheute.de)")
    logger.info("=" * 60)

    load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

    started = now_iso()
    source_url = f"{WIKIPEDIA_API_BASE},{Path(CHANNEL_LINKS_FILE).name}"
    supabase: Optional[Client] = None

    try:
        supabase = get_supabase_client()
        ensure_enrichment_table_exists(supabase)

        update_import_status(supabase, {
            'id': IMPORT_STATUS_ID,
            'status': 'running',
            'started_at': started,
            'updated_at': started,
            'source_url': source_url,
        })

        channels = fetch_channels(supabase)
        channel_links_cfg = load_channel_links()
        channel_rows = build_channel_rows(channels, channel_links_cfg)

        programs = fetch_program_candidates(supabase)
        program_rows = build_program_rows(programs)

        gated_channel_rows, channel_gate_report = apply_policy_gates(channel_rows)
        gated_program_rows, program_gate_report = apply_policy_gates(program_rows)

        inserted_channels = upsert_rows(supabase, gated_channel_rows)
        inserted_programs = upsert_rows(supabase, gated_program_rows)

        total_failed = int(channel_gate_report.get('failed', 0)) + int(program_gate_report.get('failed', 0))
        quality_report = {
            'run_started_at': started,
            'run_finished_at': now_iso(),
            'config': {
                'lookback_days': LOOKBACK_DAYS,
                'lookahead_days': LOOKAHEAD_DAYS,
                'max_programs_per_run': MAX_PROGRAMS_PER_RUN,
                'min_summary_len': MIN_SUMMARY_LEN,
                'min_confidence': MIN_CONFIDENCE,
                'verify_links': VERIFY_LINKS,
                'allowed_domains_count': len(OFFICIAL_ALLOWED_DOMAINS),
            },
            'input_counts': {
                'channels_in_db': len(channels),
                'program_candidates': len(programs),
                'raw_channel_rows': len(channel_rows),
                'raw_program_rows': len(program_rows),
            },
            'gate_reports': {
                'channels': channel_gate_report,
                'programs': program_gate_report,
            },
            'upserted_rows': inserted_channels + inserted_programs,
            'policy_failed_rows': total_failed,
        }
        report_path = write_quality_report(quality_report)

        finished = now_iso()
        update_import_status(supabase, {
            'id': IMPORT_STATUS_ID,
            'status': 'success',
            'last_run_at': finished,
            'finished_at': finished,
            'channels_processed': len(channels),
            'programs_inserted': inserted_channels + inserted_programs,
            # Reused as policy gate failed counter for enrichment pipeline runs.
            'programs_deleted': total_failed,
            'error_message': None,
            'updated_at': finished,
            'source_url': source_url,
        })

        logger.info(
            "Enrichment completed: channels=%s program_candidates=%s rows=%s policy_failed=%s report=%s",
            len(channels),
            len(programs),
            inserted_channels + inserted_programs,
            total_failed,
            report_path or 'n/a',
        )
        return 0

    except Exception as e:
        logger.exception("Content enrichment import failed")
        if supabase:
            update_import_status(supabase, {
                'id': IMPORT_STATUS_ID,
                'status': 'error',
                'finished_at': now_iso(),
                'error_message': str(e),
                'updated_at': now_iso(),
                'source_url': source_url,
            })
        return 1


if __name__ == '__main__':
    sys.exit(main())
