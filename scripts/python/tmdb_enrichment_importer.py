#!/usr/bin/env python3
"""
TMDB Enrichment Importer for fernsehheute.de

For each program that lacks a poster or TMDB enrichment:
  1. Detect content type (Movie / TV series) from genre
  2. Search TMDB (German language preferred)
  3. Fetch full details: poster, cast (top 8), director/creator, runtime, release year
  4. Update programs_de.poster_url if empty
  5. Upsert rows into content_enrichment_de (provider='tmdb')

Requirements:
  pip install supabase python-dotenv requests

Configuration (.env keys):
  TMDB_API_KEY         — required; free key from https://www.themoviedb.org/settings/api
  TMDB_LANGUAGE        — default 'de'  (German metadata preferred)
  TMDB_MAX_PROGRAMS    — default 200
  TMDB_LOOKBACK_DAYS   — default 2
  TMDB_LOOKAHEAD_DAYS  — default 7
  TMDB_MIN_CONFIDENCE  — default 0.50
  TMDB_METADATA_TTL_DAYS — default 60
  TMDB_UPDATE_POSTER_URL — default '1'  (update programs_de.poster_url)
  TMDB_HTTP_TIMEOUT    — default 12
  TMDB_REQUEST_SLEEP   — default 0.25
"""

import hashlib
import json
import logging
import os
import re
import sys
import time
import unicodedata
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.parse import quote

import requests
from dotenv import load_dotenv
from postgrest import APIError
from supabase import Client, ClientOptions, create_client

try:
    from pg_adapter import create_postgres_client
except ImportError:
    create_postgres_client = None


# ────────────────────────────────────────────────────────────
# CONFIG
# ────────────────────────────────────────────────────────────

TMDB_API_KEY       = os.getenv('TMDB_API_KEY', '')
TMDB_API_BASE      = 'https://api.themoviedb.org/3'
TMDB_IMAGE_BASE    = 'https://image.tmdb.org/t/p/w500'
TMDB_LANGUAGE      = os.getenv('TMDB_LANGUAGE', 'de')
TMDB_FALLBACK_LANG = 'en'

CHANNELS_TABLE    = os.getenv('SUPABASE_CHANNELS_TABLE', 'channels_de')
PROGRAMS_TABLE    = os.getenv('SUPABASE_PROGRAMS_TABLE', 'programs_de')
ENRICHMENT_TABLE  = os.getenv('SUPABASE_ENRICHMENT_TABLE', 'content_enrichment_de')
IMPORT_STATUS_TABLE = os.getenv('IMPORT_STATUS_TABLE', 'import_status')
IMPORT_STATUS_ID  = os.getenv('TMDB_IMPORT_STATUS_ID', 'tmdb_enrichment_de')

MAX_PROGRAMS      = int(os.getenv('TMDB_MAX_PROGRAMS', '200'))
LOOKBACK_DAYS     = int(os.getenv('TMDB_LOOKBACK_DAYS', '2'))
LOOKAHEAD_DAYS    = int(os.getenv('TMDB_LOOKAHEAD_DAYS', '7'))
MIN_CONFIDENCE    = float(os.getenv('TMDB_MIN_CONFIDENCE', '0.50'))
METADATA_TTL_DAYS = int(os.getenv('TMDB_METADATA_TTL_DAYS', '60'))
UPDATE_POSTER_URL = os.getenv('TMDB_UPDATE_POSTER_URL', '1') == '1'
HTTP_TIMEOUT      = float(os.getenv('TMDB_HTTP_TIMEOUT', '12'))
REQUEST_SLEEP     = float(os.getenv('TMDB_REQUEST_SLEEP', '0.25'))
BATCH_SIZE        = 100

SUPABASE_MAX_RETRIES = int(os.getenv('SUPABASE_MAX_RETRIES', '6'))
SUPABASE_RETRY_DELAY = float(os.getenv('SUPABASE_RETRY_DELAY', '2'))

# Genre → content_type mapping
MOVIE_GENRES = {'film', 'spielfilm', 'kinofilm', 'kino', 'telefilm', 'movie', 'thriller',
                'komödie', 'drama', 'action', 'animation', 'abenteuer', 'horror',
                'science-fiction', 'western', 'romantik', 'musical', 'krimi'}
TV_GENRES    = {'serie', 'serien', 'sitcom', 'soap', 'telenovela', 'miniserie',
                'fernsehfilm', 'fiction', 'reality', 'show', 'talkshow', 'dokusoap'}


# ────────────────────────────────────────────────────────────
# LOGGING
# ────────────────────────────────────────────────────────────

def setup_logging() -> logging.Logger:
    log_file = os.getenv('TMDB_LOG_FILE',
                         os.path.join(os.path.dirname(__file__), 'tmdb_enrichment.log'))
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s %(levelname)s %(message)s',
        handlers=[logging.FileHandler(log_file, encoding='utf-8'), logging.StreamHandler(sys.stdout)],
    )
    return logging.getLogger(__name__)

logger = setup_logging()


# ────────────────────────────────────────────────────────────
# TEXT HELPERS
# ────────────────────────────────────────────────────────────

def normalize(text: str) -> str:
    v = (text or '').lower().strip()
    v = unicodedata.normalize('NFD', v)
    v = ''.join(c for c in v if unicodedata.category(c) != 'Mn')
    v = re.sub(r'[^a-z0-9\s]', ' ', v)
    return re.sub(r'\s+', ' ', v).strip()


def clean_title_for_search(title: str) -> str:
    """Remove episode/season indicators before searching."""
    v = normalize(title)
    v = re.sub(r'\b(folge|episode|teil)\s*\d+\b', ' ', v)
    v = re.sub(r'\b(staffel|season|series)\s*\d+\b', ' ', v)
    v = re.sub(r'\s*[-–:]\s+.*$', '', v)          # strip "Title: Subtitle"
    v = re.sub(r'\s*\(\d{4}\)$', '', v)            # strip "(2023)"
    return re.sub(r'\s+', ' ', v).strip()


def match_confidence(query: str, result_title: str, result_overview: str) -> float:
    q = clean_title_for_search(query)
    r = normalize(result_title)
    s = normalize(result_overview or '')
    if not q or not r:
        return 0.0
    q_tokens = {t for t in q.split() if len(t) >= 3}
    r_tokens = {t for t in r.split() if len(t) >= 3}
    if not q_tokens or not r_tokens:
        return 0.0
    overlap = len(q_tokens & r_tokens) / max(len(q_tokens), 1)
    summary_hits = sum(1 for t in q_tokens if t in s) / max(len(q_tokens), 1)
    exact   = 0.25 if q == r else 0.0
    starts  = 0.10 if r.startswith(q[:min(len(q), 20)]) else 0.0
    return min(1.0, round(overlap * 0.55 + summary_hits * 0.35 + exact + starts, 3))


def sha1(value: str) -> str:
    return hashlib.sha1(value.encode()).hexdigest()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def expires_iso() -> str:
    return (datetime.now(timezone.utc) + timedelta(days=METADATA_TTL_DAYS)).isoformat()


def detect_content_type(genre: str) -> str:
    """Return 'movie', 'tv', or 'auto' based on genre string."""
    g = normalize(genre or '')
    tokens = set(g.split())
    for kw in MOVIE_GENRES:
        if kw in g:
            return 'movie'
    for kw in TV_GENRES:
        if kw in g:
            return 'tv'
    return 'auto'   # try movie first, then tv


# ────────────────────────────────────────────────────────────
# SUPABASE CLIENT
# ────────────────────────────────────────────────────────────

def get_supabase_client() -> Client:
    database_url = os.getenv('DATABASE_URL')
    if database_url and create_postgres_client:
        logger.info("Using direct Postgres connection from DATABASE_URL")
        return create_postgres_client(database_url)
    url = os.getenv('SUPABASE_URL')
    key = (os.getenv('SUPABASE_SERVICE_KEY') or
           os.getenv('SUPABASE_READ_KEY') or
           os.getenv('SUPABASE_ANON_KEY') or '')
    if not url or not key:
        raise ValueError('Set DATABASE_URL or SUPABASE_URL + SUPABASE_SERVICE_KEY')
    return create_client(url, key, options=ClientOptions(schema='public'))


def execute_retry(req, label: str = ''):
    for attempt in range(1, SUPABASE_MAX_RETRIES + 1):
        try:
            return req.execute()
        except APIError as e:
            if 'PGRST002' not in str(e) and '503' not in str(e):
                raise
            if attempt == SUPABASE_MAX_RETRIES:
                raise
            delay = min(60, SUPABASE_RETRY_DELAY * (2 ** (attempt - 1)))
            logger.warning(f"{label} retry {attempt}/{SUPABASE_MAX_RETRIES} in {delay:.1f}s")
            time.sleep(delay)


def update_import_status(sb: Client, payload: dict) -> None:
    try:
        execute_retry(sb.table(IMPORT_STATUS_TABLE).upsert(payload, on_conflict='id'))
    except Exception as e:
        logger.warning(f"import_status update failed: {e}")


# ────────────────────────────────────────────────────────────
# TMDB API CALLS
# ────────────────────────────────────────────────────────────

HEADERS = {'User-Agent': 'fernsehheute-tmdb-bot/1.0 (https://fernsehheute.de)'}

def tmdb_get(path: str, params: dict) -> Optional[dict]:
    if not TMDB_API_KEY:
        return None
    params = dict(params)
    params['api_key'] = TMDB_API_KEY
    url = f"{TMDB_API_BASE}{path}"
    try:
        r = requests.get(url, params=params, timeout=HTTP_TIMEOUT, headers=HEADERS)
        if r.status_code == 404:
            return None
        r.raise_for_status()
        return r.json()
    except Exception as e:
        logger.debug(f"TMDB GET {path} failed: {e}")
        return None


def search_tmdb(title: str, content_type: str, year: Optional[int] = None) -> Optional[dict]:
    """
    Search TMDB for title. content_type: 'movie', 'tv', 'auto'.
    Returns best matching result dict (with '_type' key) or None.
    """
    search_title = clean_title_for_search(title)
    if not search_title:
        return None

    types_to_try: List[str] = []
    if content_type == 'movie':
        types_to_try = ['movie', 'tv']
    elif content_type == 'tv':
        types_to_try = ['tv', 'movie']
    else:
        types_to_try = ['movie', 'tv']

    best: Optional[dict] = None
    best_conf = 0.0

    for lang in [TMDB_LANGUAGE, TMDB_FALLBACK_LANG]:
        for ctype in types_to_try:
            params = {'query': search_title, 'language': lang}
            if year and ctype == 'movie':
                params['year'] = year
            data = tmdb_get(f'/search/{ctype}', params)
            time.sleep(REQUEST_SLEEP)
            if not data:
                continue
            for item in (data.get('results') or [])[:5]:
                result_title = item.get('title') or item.get('name') or ''
                overview     = item.get('overview') or ''
                conf = match_confidence(title, result_title, overview)
                if conf > best_conf:
                    best_conf = conf
                    best = dict(item)
                    best['_type']       = ctype
                    best['_confidence'] = conf
                    best['_lang']       = lang

        if best and best_conf >= MIN_CONFIDENCE:
            break  # good enough from first language pass

    if best and best_conf >= MIN_CONFIDENCE:
        return best
    return None


def fetch_details(tmdb_id: int, content_type: str) -> Optional[dict]:
    """Fetch full details including credits."""
    data = tmdb_get(
        f'/{content_type}/{tmdb_id}',
        {'language': TMDB_LANGUAGE, 'append_to_response': 'credits'}
    )
    time.sleep(REQUEST_SLEEP)
    if not data:
        # fallback English
        data = tmdb_get(
            f'/{content_type}/{tmdb_id}',
            {'language': TMDB_FALLBACK_LANG, 'append_to_response': 'credits'}
        )
        time.sleep(REQUEST_SLEEP)
    return data


def extract_cast(details: dict, content_type: str, max_cast: int = 8) -> List[dict]:
    """Extract top cast + director/creator from TMDB details."""
    cast_list: List[dict] = []
    credits = details.get('credits') or {}

    # Actors (cast)
    for person in (credits.get('cast') or [])[:max_cast]:
        cast_list.append({
            'name':    (person.get('name') or '').strip(),
            'role':    'actor',
            'character': (person.get('character') or '').strip(),
            'order':   person.get('order', 99),
            'tmdb_id': person.get('id'),
        })

    # Director (crew)
    for person in (credits.get('crew') or []):
        job = (person.get('job') or '').lower()
        if job in ('director', 'regisseur'):
            cast_list.append({
                'name':    (person.get('name') or '').strip(),
                'role':    'director',
                'character': '',
                'order':   -1,
                'tmdb_id': person.get('id'),
            })
            break

    # TV creator
    if content_type == 'tv':
        for person in (details.get('created_by') or []):
            cast_list.append({
                'name':    (person.get('name') or '').strip(),
                'role':    'creator',
                'character': '',
                'order':   -2,
                'tmdb_id': person.get('id'),
            })

    return cast_list


def extract_runtime(details: dict, content_type: str) -> Optional[int]:
    if content_type == 'movie':
        return details.get('runtime') or None
    # TV: use episode_run_time list
    runtimes = details.get('episode_run_time') or []
    return runtimes[0] if runtimes else None


def extract_release_year(details: dict, content_type: str) -> Optional[int]:
    if content_type == 'movie':
        date = details.get('release_date') or ''
    else:
        date = details.get('first_air_date') or ''
    if date and len(date) >= 4:
        try:
            return int(date[:4])
        except ValueError:
            pass
    return None


# ────────────────────────────────────────────────────────────
# DATA FETCHING
# ────────────────────────────────────────────────────────────

def fetch_programs_needing_enrichment(sb: Client) -> List[dict]:
    """Fetch programs without TMDB enrichment in the time window."""
    now = datetime.now(timezone.utc)
    start_iso = (now - timedelta(days=LOOKBACK_DAYS)).isoformat()
    end_iso   = (now + timedelta(days=LOOKAHEAD_DAYS)).isoformat()

    programs: List[dict] = []
    offset = 0
    while len(programs) < MAX_PROGRAMS:
        res = execute_retry(
            sb.table(PROGRAMS_TABLE)
              .select('id,title,description,genre,channel_id,start_time,poster_url')
              .gte('start_time', start_iso)
              .lte('start_time', end_iso)
              .order('start_time', desc=False)
              .range(offset, offset + 999),
            label='fetch programs'
        )
        data = getattr(res, 'data', []) or []
        if not data:
            break
        programs.extend(data)
        if len(data) < 1000:
            break
        offset += 1000

    # Fetch already-enriched program IDs
    enriched_ids: set = set()
    offset = 0
    while True:
        res = execute_retry(
            sb.table(ENRICHMENT_TABLE)
              .select('entity_id')
              .eq('provider', 'tmdb')
              .eq('entity_kind', 'program')
              .eq('verification_status', 'verified')
              .gte('last_verified_at', (now - timedelta(days=METADATA_TTL_DAYS)).isoformat())
              .range(offset, offset + 999),
            label='fetch enriched ids'
        )
        data = getattr(res, 'data', []) or []
        for row in data:
            enriched_ids.add(str(row.get('entity_id') or ''))
        if len(data) < 1000:
            break
        offset += 1000

    # Filter to unenriched programs
    unenriched = [p for p in programs if str(p.get('id') or '') not in enriched_ids]
    unenriched.sort(key=lambda p: (
        bool(p.get('poster_url')),   # no poster first
        p.get('start_time') or '',
    ))
    return unenriched[:MAX_PROGRAMS]


# ────────────────────────────────────────────────────────────
# ROW BUILDERS
# ────────────────────────────────────────────────────────────

def build_enrichment_rows(program: dict, search_result: dict, details: dict) -> List[dict]:
    program_id  = program['id']
    channel_id  = (program.get('channel_id') or '').strip()
    title       = (program.get('title') or '').strip()
    content_type = search_result['_type']
    tmdb_id      = search_result.get('id')
    confidence   = float(search_result.get('_confidence') or 0.0)
    tmdb_id_str  = str(tmdb_id) if tmdb_id else sha1(title)
    ts_now       = now_iso()
    expires      = expires_iso()

    cast_json    = extract_cast(details, content_type)
    release_year = extract_release_year(details, content_type)
    runtime_min  = extract_runtime(details, content_type)

    poster_path  = (details.get('poster_path') or '').strip()
    poster_url   = (TMDB_IMAGE_BASE + poster_path) if poster_path else ''

    overview = (details.get('overview') or '').strip()
    if not overview:
        overview = (search_result.get('overview') or '').strip()

    result_title = (details.get('title') or details.get('name') or
                    search_result.get('title') or search_result.get('name') or title)

    genres = [g.get('name', '') for g in (details.get('genres') or []) if g.get('name')]

    rows: List[dict] = []

    # ── metadata row ──
    rows.append({
        'entity_kind':         'program',
        'entity_id':           str(program_id),
        'program_id':          int(program_id),
        'channel_id':          channel_id,
        'provider':            'tmdb',
        'enrichment_type':     'tmdb_metadata',
        'dedupe_key':          f'tmdb:{tmdb_id_str}',
        'external_id':         str(tmdb_id) if tmdb_id else None,
        'external_url':        f"https://www.themoviedb.org/{content_type}/{tmdb_id}" if tmdb_id else None,
        'title':               result_title,
        'synopsis':            overview or None,
        'cast_json':           cast_json or None,
        'release_year':        release_year,
        'runtime_min':         runtime_min,
        'license_name':        'CC BY-NC 4.0',
        'license_url':         'https://www.themoviedb.org/documentation/api/terms-of-use',
        'attribution_required': True,
        'attribution_text':    'Daten bereitgestellt von TMDb (themoviedb.org)',
        'usage_scope':         'editorial',
        'confidence':          confidence,
        'verification_status': 'verified',
        'last_verified_at':    ts_now,
        'expires_at':          expires,
        'source_payload': {
            'tmdb_id':       tmdb_id,
            'content_type':  content_type,
            'language':      search_result.get('_lang', TMDB_LANGUAGE),
            'query_title':   title,
            'genres':        genres,
        },
    })

    # ── poster/image row ──
    if poster_url:
        rows.append({
            'entity_kind':         'program',
            'entity_id':           str(program_id),
            'program_id':          int(program_id),
            'channel_id':          channel_id,
            'provider':            'tmdb',
            'enrichment_type':     'tmdb_image',
            'dedupe_key':          f'tmdb-poster:{tmdb_id_str}',
            'external_id':         str(tmdb_id) if tmdb_id else None,
            'external_url':        f"https://www.themoviedb.org/{content_type}/{tmdb_id}" if tmdb_id else None,
            'title':               result_title,
            'image_url':           poster_url,
            'license_name':        'CC BY-NC 4.0',
            'license_url':         'https://www.themoviedb.org/documentation/api/terms-of-use',
            'attribution_required': True,
            'attribution_text':    'Daten bereitgestellt von TMDb (themoviedb.org)',
            'usage_scope':         'editorial',
            'confidence':          confidence,
            'verification_status': 'verified',
            'last_verified_at':    ts_now,
            'expires_at':          expires,
            'source_payload': {
                'tmdb_id':      tmdb_id,
                'content_type': content_type,
                'poster_path':  poster_path,
            },
        })

    return rows


# ────────────────────────────────────────────────────────────
# UPSERT
# ────────────────────────────────────────────────────────────

def upsert_enrichment(sb: Client, rows: List[dict]) -> int:
    if not rows:
        return 0
    total = 0
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i:i + BATCH_SIZE]
        execute_retry(
            sb.table(ENRICHMENT_TABLE).upsert(
                batch,
                on_conflict='entity_kind,entity_id,provider,enrichment_type,dedupe_key'
            ),
            label='upsert tmdb enrichment'
        )
        total += len(batch)
    return total


def update_poster_url(sb: Client, program_id: int, poster_url: str) -> None:
    """Set programs_de.poster_url if it is currently empty."""
    try:
        # Try with .is_() first (Supabase REST), fallback for direct Postgres
        try:
            execute_retry(
                sb.table(PROGRAMS_TABLE)
                  .update({'poster_url': poster_url})
                  .eq('id', program_id)
                  .is_('poster_url', 'null'),
                label='update poster_url'
            )
        except (AttributeError, TypeError):
            # pg_adapter doesn't support .is_() — use .filter() or unconditional update
            execute_retry(
                sb.table(PROGRAMS_TABLE)
                  .update({'poster_url': poster_url})
                  .eq('id', program_id),
                label='update poster_url (pg fallback)'
            )
    except Exception as e:
        logger.warning(f"poster_url update failed for program {program_id}: {e}")


# ────────────────────────────────────────────────────────────
# MAIN
# ────────────────────────────────────────────────────────────

def main() -> int:
    logger.info("=" * 60)
    logger.info("TMDB Enrichment Importer (fernsehheute.de)")
    logger.info("=" * 60)

    load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

    # Re-read after dotenv
    global TMDB_API_KEY
    TMDB_API_KEY = os.getenv('TMDB_API_KEY', '')

    if not TMDB_API_KEY:
        logger.error("TMDB_API_KEY not set. Get a free key at https://www.themoviedb.org/settings/api")
        return 1

    sb: Optional[Client] = None
    started = now_iso()

    try:
        sb = get_supabase_client()
        update_import_status(sb, {
            'id': IMPORT_STATUS_ID,
            'status': 'running',
            'started_at': started,
            'updated_at': started,
            'source_url': TMDB_API_BASE,
        })

        programs = fetch_programs_needing_enrichment(sb)
        logger.info(f"Programs to enrich: {len(programs)}")

        enriched   = 0
        skipped    = 0
        poster_upd = 0
        all_rows: List[dict] = []

        for prog in programs:
            pid   = prog.get('id')
            title = (prog.get('title') or '').strip()
            genre = (prog.get('genre') or '').strip()
            if not title:
                skipped += 1
                continue

            content_type = detect_content_type(genre)
            logger.info(f"[{pid}] '{title}' ({genre}) → {content_type}")

            result = search_tmdb(title, content_type)
            if not result:
                logger.debug(f"  no TMDB match for '{title}'")
                skipped += 1
                continue

            tmdb_id = result.get('id')
            if not tmdb_id:
                skipped += 1
                continue

            details = fetch_details(tmdb_id, result['_type'])
            if not details:
                skipped += 1
                continue

            rows = build_enrichment_rows(prog, result, details)
            all_rows.extend(rows)

            # Update poster in programs_de
            if UPDATE_POSTER_URL and not (prog.get('poster_url') or '').strip():
                poster_path = (details.get('poster_path') or '').strip()
                if poster_path:
                    update_poster_url(sb, pid, TMDB_IMAGE_BASE + poster_path)
                    poster_upd += 1

            enriched += 1
            logger.info(f"  ✓ matched '{result.get('title') or result.get('name')}' "
                        f"(conf={result['_confidence']:.2f}, type={result['_type']}, "
                        f"cast={len(rows[0].get('cast_json') or [])})")

        total_upserted = upsert_enrichment(sb, all_rows)
        finished = now_iso()

        logger.info(f"\nDone — enriched={enriched}, skipped={skipped}, "
                    f"rows={total_upserted}, poster_updates={poster_upd}")

        update_import_status(sb, {
            'id': IMPORT_STATUS_ID,
            'status': 'success',
            'last_run_at': finished,
            'finished_at': finished,
            'programs_inserted': total_upserted,
            'programs_deleted': skipped,
            'error_message': None,
            'updated_at': finished,
            'source_url': TMDB_API_BASE,
        })
        return 0

    except Exception:
        logger.exception("TMDB enrichment failed")
        if sb:
            update_import_status(sb, {
                'id': IMPORT_STATUS_ID,
                'status': 'error',
                'finished_at': now_iso(),
                'error_message': 'See tmdb_enrichment.log',
                'updated_at': now_iso(),
                'source_url': TMDB_API_BASE,
            })
        return 1


if __name__ == '__main__':
    sys.exit(main())
