/**
 * EPG data fetching — SERVER-ONLY (Astro build time).
 *
 * Usa DATABASE_URL (PostgreSQL Contabo).
 * Fallback: src/data/epg-cache.json (XMLTV snapshot locale/pre-fetched).
 * Nessuna dipendenza da Supabase.
 */
import pg from 'pg';
import { getChannelLogo } from '../utils/channelLogos';
import { HUB_CHANNELS } from '../utils/hubChannels';
import { normCid } from '../utils/channelSlug';
import type { Channel, Program } from '../types';

// Import fallback data directly
import epgData from '../data/epg-cache.json';

const { Pool } = pg;

const databaseUrl = (import.meta.env.DATABASE_URL as string | undefined)?.trim() || '';

const pgPool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      max: Number(import.meta.env.POSTGRES_POOL_MAX ?? 4),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 8_000,
    })
  : null;

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
  id: number | string;
  channel_id: string;
  name: string;
  logo_url: string | null;
  channel_number: number | null;
  category: string | null;
  stream_url: string | null;
  website_url: string | null;
}

function mapChannel(raw: RawChannel): Channel {
  const normId = normCid(raw.channel_id);
  const logo = getChannelLogo(normId, raw.logo_url, raw.name);
  return {
    id: normId,
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
  if (pgPool) {
    try {
      const rows = await pgQuery<RawChannel>(
        `SELECT id, channel_id, name, logo_url, channel_number, category, stream_url, website_url
         FROM channels_de
         ORDER BY channel_number ASC NULLS LAST
         LIMIT 500`,
      );
      if (rows && rows.length > 0) return rows.map(mapChannel);
    } catch (err) {
      console.warn('[epg.ts] PostgreSQL fetchChannels failed, using local cache:', err instanceof Error ? err.message : err);
    }
  }

  // Fallback: epg-cache.json
  if (epgData?.channels && epgData.channels.length > 0) {
    return epgData.channels.map((ch: any, idx: number) => {
      const normId = normCid(ch.id);
      return {
        id: normId,
        name: ch.name,
        number: idx + 1,
        logo: getChannelLogo(normId, ch.logo, ch.name),
        type: 'Generalista',
        programs: [],
        visible: true,
        position: idx + 1,
      };
    });
  }

  // Ultimo fallback garantito
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
  id: number | string;
  channel_id: string;
  title: string;
  slug?: string | null;
  description: string | null;
  start_time: string;
  end_time: string;
  date: string;
  genre?: string | null;
  category?: string | null;
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
    id: String(row.id),
    channel_id: normCid(String(row.channel_id)),
    title: String(row.title),
    slug: (row.slug as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    start_time: toIso(row.start_time),
    end_time: toIso(row.end_time),
    date: toDateOnly(row.date),
    genre: (row.genre as string | null) ?? (row.category as string | null) ?? null,
    category: (row.category as string | null) ?? (row.genre as string | null) ?? null,
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
    category: raw.genre ?? raw.category ?? '',
    description: raw.description ?? '',
    poster_url: raw.poster_url ?? null,
    channel_id: normCid(raw.channel_id),
  };
}

export async function fetchProgramsForDate(date: string, channelId?: string): Promise<Program[]> {
  if (pgPool) {
    try {
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
      if (rows && rows.length > 0) {
        return rows.map((row) => mapProgram(normalizeProgram(row)));
      }
    } catch (err) {
      console.warn('[epg.ts] PostgreSQL fetchProgramsForDate failed, using local cache:', err instanceof Error ? err.message : err);
    }
  }

  // Fallback: epg-cache.json
  if (epgData?.programmes && epgData.programmes.length > 0) {
    const targetDate = date.slice(0, 10);
    const targetChannelId = channelId ? normCid(channelId) : null;

    const filtered = (epgData.programmes as any[]).filter((p) => {
      const matchesDate = p.date === targetDate || p.start_time.startsWith(targetDate);
      if (!matchesDate) return false;
      if (targetChannelId) {
        const pChan = normCid(p.channel_id);
        return pChan === targetChannelId;
      }
      return true;
    });

    return filtered.map((p) => mapProgram(normalizeProgram(p)));
  }

  return [];
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
  if (programIds.length === 0 || !pgPool) return new Map();
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

  try {
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
  } catch (err) {
    console.warn('[epg.ts] TMDb enrichment query skipped:', err instanceof Error ? err.message : err);
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
