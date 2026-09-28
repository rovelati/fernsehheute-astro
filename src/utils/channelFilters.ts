/**
 * Channel & Program Quality Filters — fernsehheute.de
 *
 * Filtri di qualità per:
 * 1. Esclusione canali e contenuti per adulti (compliance Google AdSense / Bing SafeSearch).
 * 2. Esclusione canali di test (Testkanal Sky, canali tecnici).
 * 3. Esclusione placeholder vuoti ("No Data", "Sendepause", "Momentan kein Programm").
 */
import type { Channel, Program } from '../types';
import { normCid } from './channelSlug';

export const ADULT_PATTERNS: RegExp[] = [
  /playboy/i,
  /penthouse/i,
  /blue\s*hustler/i,
  /hustler/i,
  /beate[-_\s]*uhse/i,
  /lust\s*pur/i,
  /dorcel/i,
  /erotik/i,
  /erotic/i,
  /adult/i,
  /\bsex\b/i,
  /bizarre/i,
  /redlight/i,
  /venus/i,
  /private[-_\s]*tv/i,
];

export const TEST_PATTERNS: RegExp[] = [
  /testkanal/i,
  /test[-_]kanal/i,
  /testchannel/i,
  /test[-_]channel/i,
];

export const INVALID_PROGRAM_TITLES: string[] = [
  'no data',
  'momentan kein programm',
  'sendepause',
  'keine informationen',
  'kein programm',
  'kein programm verfuegbar',
  'kein programm verfügbar',
  'hinweistafel',
  'dauerwerbesendung',
  'nicht belegt',
  'programmhinweis',
  'test',
  'testbild',
  'null',
  'undefined',
];

export function isAdultChannel(channelId: string, name?: string): boolean {
  const str = `${channelId} ${name ?? ''}`.toLowerCase();
  return ADULT_PATTERNS.some((pattern) => pattern.test(str));
}

export function isTestChannel(channelId: string, name?: string): boolean {
  const str = `${channelId} ${name ?? ''}`.toLowerCase();
  return TEST_PATTERNS.some((pattern) => pattern.test(str));
}

export function isRealProgram(title?: string | null): boolean {
  if (!title) return false;
  const t = title.toLowerCase().trim();
  if (t.length === 0) return false;
  if (INVALID_PROGRAM_TITLES.some((inv) => t === inv || t.startsWith(inv))) {
    return false;
  }
  return true;
}

export function filterRealPrograms(programs: Program[]): Program[] {
  return programs.filter((p) => isRealProgram(p.title));
}

export function isValidChannelForSite(channel: Channel, programs: Program[]): boolean {
  if (isAdultChannel(channel.id, channel.name)) return false;
  if (isTestChannel(channel.id, channel.name)) return false;

  const realPrograms = filterRealPrograms(programs);
  return realPrograms.length >= 3;
}
