/**
 * EPG data fetching — SERVER-ONLY (Astro build time).
 *
 * Preferisce DATABASE_URL (Postgres locale Contabo).
 * Fallback: SUPABASE_URL + SUPABASE_SERVICE_KEY (REST), se ancora configurati.
 *
 * Tabelle: channels_de, programs_de, content_enrichment_de
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import pg from 'pg';
import { getChannelLogo } from '../utils/channelLogos';
import type { Channel, Program } from '../types';

const { Pool } = pg;

const databaseUrl = (import.meta.env.DATABASE_URL as string | undefined)?.trim() || '';
const supabaseUrl = (import.meta.env.SUPABASE_URL as string | undefined)?.trim() || '';
const supabaseKey = (import.meta.env.SUPABASE_SERVICE_KEY as string | undefined)?.trim() || '';

const pgPool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      max: Number(import.meta.env.POSTGRES_POOL_MAX ?? 4),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 8_000,
    })
  : null;

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (supabase) return supabase;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing DATABASE_URL (preferred) or SUPABASE_URL + SUPABASE_SERVICE_KEY');
  }
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return supabase;
}

async function pgQuery<T = any>(
  text: string,
  values: unknown[] = [],
): Promise<T[]> {
  if (!pgPool) throw new Error('DATABASE_URL not configured');
  const result = await pgPool.query(text, values);
  return result.rows as T[];
}

// ---------------------------------------------------------------------------
// Channels
// ---------------------------------------------------------------------------

interface RawChannel {
  id: number;
  channel_id: string;
  name: string;
  logo_url: string | null;
  channel_number: number | null;
  category: string | null;
  stream_url: string | null;
  website_url: string | null;
}

function mapChannel(raw: RawChannel): Channel {
  const logo = getChannelLogo(raw.channel_id, raw.logo_url, raw.name);
  return {
    id: raw.channel_id,
    name: raw.name,
    number: raw.channel_number ?? 0,
    logo,
    type: 'Generalista',
    programs: [],
    visible: true,
    position: raw.channel_number ?? 999,
    streamUrl: raw.stream_url ?? undefined,
    website: raw.website_url ?? undefined,
  };
}

export async function fetchChannels(): Promise<Channel[]> {
  try {
    if (pgPool) {
      const rows = await pgQuery<RawChannel>(
        `SELECT id, channel_id, name, logo_url, channel_number, category, stream_url, website_url
         FROM channels_de
         ORDER BY channel_number ASC NULLS LAST
         LIMIT 500`,
      );
      if (rows && rows.length > 0) return rows.map(mapChannel);
    }

    const { data, error } = await getSupabase()
      .from('channels_de')
      .select('id, channel_id, name, logo_url, channel_number, category, stream_url, website_url')
      .order('channel_number', { ascending: true, nullsFirst: false })
      .limit(500);

    if (error) throw error;
    if (data && data.length > 0) return ((data as RawChannel[]) ?? []).map(mapChannel);
  } catch (err) {
    console.warn('[epg.ts] fetchChannels failed, using HUB_CHANNELS fallback:', err instanceof Error ? err.message : err);
  }

  // Fallback garantito sui canali principali tedeschi
  const { HUB_CHANNELS } = await import('../utils/hubChannels');
  return HUB_CHANNELS.map((ch, idx) => ({
    id: ch.id,
    name: ch.name,
    number: idx + 1,
    logo: getChannelLogo(ch.id, null, ch.name),
    type: 'Generalista',
    programs: [],
    visible: true,
    position: idx + 1,
  }));
}

// ---------------------------------------------------------------------------
// Programs
// ---------------------------------------------------------------------------

interface RawProgram {
  id: number;
  channel_id: string;
  title: string;
  slug: string | null;
  description: string | null;
  start_time: string;
  end_time: string;
  date: string;
  genre: string | null;
  poster_url: string | null;
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return String(value ?? '');
}

function toDateOnly(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? '').slice(0, 10);
}

function normalizeProgram(row: Record<string, unknown>): RawProgram {
  return {
    id: Number(row.id),
    channel_id: String(row.channel_id),
    title: String(row.title),
    slug: (row.slug as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    start_time: toIso(row.start_time),
    end_time: toIso(row.end_time),
    date: toDateOnly(row.date),
    genre: (row.genre as string | null) ?? null,
    poster_url: (row.poster_url as string | null) ?? null,
  };
}

function mapProgram(raw: RawProgram): Program {
  return {
    id: String(raw.id),
    title: raw.title,
    slug: raw.slug ?? undefined,
    start_time: raw.start_time,
    end_time: raw.end_time,
    date: raw.date,
    category: raw.genre ?? '',
    description: raw.description ?? '',
    poster_url: raw.poster_url ?? null,
    channel_id: raw.channel_id,
  };
}

export async function fetchProgramsForDate(date: string, channelId?: string): Promise<Program[]> {
  try {
    if (pgPool) {
      const rows = channelId
        ? await pgQuery<Record<string, unknown>>(
            `SELECT id, channel_id, title, slug, description, start_time, end_time, date, genre, poster_url
             FROM programs_de
             WHERE date = $1::date AND channel_id = $2
             ORDER BY start_time ASC`,
            [date, channelId],
          )
        : await pgQuery<Record<string, unknown>>(
            `SELECT id, channel_id, title, slug, description, start_time, end_time, date, genre, poster_url
             FROM programs_de
             WHERE date = $1::date
             ORDER BY start_time ASC`,
            [date],
          );
      return rows.map((row) => mapProgram(normalizeProgram(row)));
    }

    const supabase = getSupabase();
    const PAGE = 1000;
    const all: RawProgram[] = [];
    let from = 0;

    while (true) {
      let q = supabase
        .from('programs_de')
        .select('id, channel_id, title, slug, description, start_time, end_time, date, genre, poster_url')
        .eq('date', date)
        .order('start_time', { ascending: true })
        .range(from, from + PAGE - 1);

      if (channelId) q = q.eq('channel_id', channelId);

      const { data, error } = await q;
      if (error) throw error;
      if (!data || data.length === 0) break;
      all.push(...(data as RawProgram[]));
      if (data.length < PAGE) break;
      from += PAGE;
    }

    return all.map(mapProgram);
  } catch (err) {
    console.warn('[epg.ts] fetchProgramsForDate failed:', err instanceof Error ? err.message : err);
    return [];
  }
}

export async function fetchProgramsWithEnrichment(date: string, channelId?: string): Promise<Program[]> {
  if (pgPool) {
    const rows = channelId
      ? await pgQuery<Record<string, unknown>>(
          `SELECT p.id, p.channel_id, p.title, p.slug, p.description, p.start_time, p.end_time, p.date, p.genre, p.poster_url,
                  (
                    SELECT e.image_url
                    FROM content_enrichment_de e
                    WHERE e.program_id = p.id
                      AND e.provider = 'tmdb'
                      AND e.verification_status = 'verified'
                      AND COALESCE(e.confidence, 0) >= 0.7
                      AND e.image_url IS NOT NULL
                    ORDER BY e.confidence DESC NULLS LAST
                    LIMIT 1
                  ) AS enrich_image
           FROM programs_de p
           WHERE p.date = $1::date AND p.channel_id = $2
           ORDER BY p.start_time ASC`,
          [date, channelId],
        )
      : await pgQuery<Record<string, unknown>>(
          `SELECT p.id, p.channel_id, p.title, p.slug, p.description, p.start_time, p.end_time, p.date, p.genre, p.poster_url,
                  (
                    SELECT e.image_url
                    FROM content_enrichment_de e
                    WHERE e.program_id = p.id
                      AND e.provider = 'tmdb'
                      AND e.verification_status = 'verified'
                      AND COALESCE(e.confidence, 0) >= 0.7
                      AND e.image_url IS NOT NULL
                    ORDER BY e.confidence DESC NULLS LAST
                    LIMIT 1
                  ) AS enrich_image
           FROM programs_de p
           WHERE p.date = $1::date
           ORDER BY p.start_time ASC`,
          [date],
        );

    return rows.map((row) => {
      const raw = normalizeProgram(row);
      const poster = (row.enrich_image as string | null) ?? raw.poster_url ?? null;
      return { ...mapProgram(raw), poster_url: poster };
    });
  }

  const supabase = getSupabase();
  const PAGE = 1000;
  const all: (RawProgram & { content_enrichment_de?: { image_url: string | null; confidence: number | null }[] })[] = [];
  let from = 0;

  while (true) {
    let q = supabase
      .from('programs_de')
      .select(`
        id, channel_id, title, description, start_time, end_time, date, genre, poster_url,
        content_enrichment_de (image_url, confidence)
      `)
      .eq('date', date)
      .order('start_time', { ascending: true })
      .range(from, from + PAGE - 1);

    if (channelId) q = q.eq('channel_id', channelId);

    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as typeof all));
    if (data.length < PAGE) break;
    from += PAGE;
  }

  return all.map((raw) => {
    const enrich = (raw.content_enrichment_de as { image_url: string | null; confidence: number | null }[] | undefined)?.[0];
    const poster = (enrich && (enrich.confidence ?? 0) >= 0.7 ? enrich.image_url : null) ?? raw.poster_url ?? null;
    return { ...mapProgram(raw), poster_url: poster };
  });
}

export interface ProgramEnrichment {
  poster_url?: string | null;
  synopsis?: string | null;
  cast_json?: { name: string; role: string; character?: string }[] | null;
  release_year?: number | null;
  runtime_min?: number | null;
}

export async function fetchTmdbEnrichment(
  programIds: (string | number)[],
): Promise<Map<string, ProgramEnrichment>> {
  if (programIds.length === 0) return new Map();
  const ids = programIds.map((id) => Number(id)).filter((n) => !Number.isNaN(n));
  if (ids.length === 0) return new Map();

  type EnrichRow = {
    program_id: number;
    enrichment_type: string;
    image_url: string | null;
    synopsis: string | null;
    cast_json: unknown | null;
    release_year: number | null;
    runtime_min: number | null;
    confidence: number | null;
  };

  const allRows: EnrichRow[] = [];

  if (pgPool) {
    const CHUNK = 500;
    for (let i = 0; i < ids.length; i += CHUNK) {
      const chunk = ids.slice(i, i + CHUNK);
      const rows = await pgQuery<EnrichRow>(
        `SELECT program_id, enrichment_type, image_url, synopsis, cast_json, release_year, runtime_min, confidence
         FROM content_enrichment_de
         WHERE program_id = ANY($1::int[])
           AND provider = 'tmdb'
           AND verification_status = 'verified'
           AND COALESCE(confidence, 0) >= 0.5
         ORDER BY confidence DESC NULLS LAST`,
        [chunk],
      );
      allRows.push(...rows);
    }
  } else {
    const supabase = getSupabase();
    const PAGE = 1000;
    const CHUNK = 500;
    for (let i = 0; i < ids.length; i += CHUNK) {
      const chunk = ids.slice(i, i + CHUNK);
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from('content_enrichment_de')
          .select('program_id, enrichment_type, image_url, synopsis, cast_json, release_year, runtime_min, confidence')
          .in('program_id', chunk)
          .eq('provider', 'tmdb')
          .eq('verification_status', 'verified')
          .gte('confidence', 0.5)
          .order('confidence', { ascending: false })
          .range(from, from + PAGE - 1);

        if (error || !data || data.length === 0) break;
        allRows.push(...(data as EnrichRow[]));
        if (data.length < PAGE) break;
        from += PAGE;
      }
    }
  }

  const result = new Map<string, ProgramEnrichment>();
  for (const row of allRows) {
    const pid = String(row.program_id);
    if (!result.has(pid)) result.set(pid, {});
    const entry = result.get(pid)!;
    if (row.enrichment_type === 'tmdb_image' && row.image_url && !entry.poster_url) {
      entry.poster_url = row.image_url;
    }
    if (row.enrichment_type === 'tmdb_metadata') {
      if (row.synopsis && !entry.synopsis) entry.synopsis = row.synopsis;
      if (row.cast_json && !entry.cast_json) {
        entry.cast_json = row.cast_json as ProgramEnrichment['cast_json'];
      }
      if (row.release_year && !entry.release_year) entry.release_year = row.release_year;
      if (row.runtime_min && !entry.runtime_min) entry.runtime_min = row.runtime_min;
    }
  }
  return result;
}

export async function fetchIndexableFilms(sinceHours = 24): Promise<{ channel_id: string; title: string }[]> {
  if (pgPool) {
    return pgQuery<{ channel_id: string; title: string }>(
      `SELECT channel_id, title
       FROM programs_de
       WHERE description IS NOT NULL
         AND created_at >= NOW() - ($1::text || ' hours')::interval
       LIMIT 200`,
      [String(sinceHours)],
    );
  }

  const since = new Date(Date.now() - sinceHours * 3600 * 1000).toISOString();
  const { data } = await getSupabase()
    .from('programs_de')
    .select('channel_id, title')
    .not('description', 'is', null)
    .gte('created_at', since)
    .limit(200);
  return data ?? [];
}
