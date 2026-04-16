/**
 * EPG data fetching — SERVER-ONLY.
 * Usa SUPABASE_SERVICE_KEY (senza prefisso VITE_): mai esposta al browser.
 * Chiamata esclusivamente da getStaticPaths() o endpoint server-side di Astro.
 *
 * Tabelle tedesche: channels_de, programs_de, content_enrichment_de
 * Differenza chiave: start_time/end_time in snake_case (vs camelCase nel progetto IT)
 */
import { createClient } from '@supabase/supabase-js';
import { getChannelLogo } from '../utils/channelLogos';
import type { Channel, Program } from '../types';

function getClient() {
  const url = import.meta.env.SUPABASE_URL as string;
  const key = import.meta.env.SUPABASE_SERVICE_KEY as string;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ---------------------------------------------------------------------------
// Channels
// ---------------------------------------------------------------------------

// Real schema programs_de (2026): id, channel_id, title, description, start_time, end_time, date, time_slot, genre, rating, poster_url, slug, created_at
// Real schema channels_de (2026): id, channel_id, name, logo_url, channel_number, category, created_at, stream_url, website_url
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

/**
 * Fetch tutti i canali ordinati per channel_number.
 * channels_de: id, channel_id, name, logo_url, channel_number, category, stream_url, website_url
 */
export async function fetchChannels(): Promise<Channel[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('channels_de')
    .select('id, channel_id, name, logo_url, channel_number, category, stream_url, website_url')
    .order('channel_number', { ascending: true, nullsFirst: false })
    .limit(500);

  if (error) throw error;
  return (data as RawChannel[] ?? []).map(mapChannel);
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

/**
 * Fetch TUTTI i programmi per una data (Europe/Berlin YYYY-MM-DD).
 * Paginazione a blocchi di 1000 (limite default Supabase).
 * Opzionalmente filtrato per channelId.
 */
export async function fetchProgramsForDate(date: string, channelId?: string): Promise<Program[]> {
  const supabase = getClient();
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
}

/**
 * Fetch programmi con enrichment TMDb (content_enrichment_de).
 * Usato facoltativamente nelle pagine hub per mostrare poster dei film.
 * Confidence >= 0.7 per evitare falsi match.
 */
export async function fetchProgramsWithEnrichment(date: string, channelId?: string): Promise<Program[]> {
  const supabase = getClient();
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

  return all.map(raw => {
    const enrich = (raw.content_enrichment_de as { image_url: string | null; confidence: number | null }[] | undefined)?.[0];
    const poster = (enrich && (enrich.confidence ?? 0) >= 0.7 ? enrich.image_url : null) ?? raw.poster_url ?? null;
    return { ...mapProgram(raw), poster_url: poster };
  });
}

/**
 * Fetch film indicizzabili aggiornati nelle ultime N ore.
 * Usato da notify-indexing.js e generate-sitemap-film.js.
 */
export async function fetchIndexableFilms(sinceHours = 24): Promise<{ channel_id: string; title: string }[]> {
  const supabase = getClient();
  const since = new Date(Date.now() - sinceHours * 3600 * 1000).toISOString();
  const { data } = await supabase
    .from('programs_de')
    .select('channel_id, title')
    .not('description', 'is', null)
    .gte('created_at', since)
    .limit(200);
  return data ?? [];
}
