/**
 * AUSTRIA_ORDER — Rangliste der TV-Sender in Österreich nach Reichweite (AGTT / Teletest) und Relevanz.
 *
 * 1. Österreichische öffentlich-rechtliche Hauptprogramme (ORF):
 *    ORF 2 (~20% Marktanteil), ORF 1 (~11% Marktanteil), ORF III (Kultur & Information), ORF Sport+
 * 2. Österreichische Privatsender (ProSiebenSat.1 PULS 4, Red Bull Media House, Mediengruppe Österreich):
 *    ServusTV (~4.5% MA), ATV (~3.5% MA), PULS 4 (~3.5% MA), ATV2, PULS 24 (Nachrichten), oe24.TV, krone.tv, Kurier TV
 * 3. Österreichisches Regionalfernsehen:
 *    W24 (Wien), R9 (Regionalfernsehen Österreich), Tirol TV, Ländle TV, KT 1, K19, Okto, WNTV
 * 4. Sparten- & Partnersender:
 *    3sat (Gemeinschaftsprogramm ORF/ZDF/SRF/ARD), ARTE
 * 5. Beliebteste deutsche Vollprogramme im österreichischen Kabel- & IPTV-Netz (Magenta, A1 Xplore TV, Drei TV):
 *    ZDF, Das Erste, RTL, ProSieben, SAT.1, VOX, Kabel Eins, RTL ZWEI, ZDFneo, Super RTL, NITRO, sixx
 */

export const AUSTRIA_ORDER: string[] = [
  // ── 1. ORF (Österreichischer Rundfunk) ───────────────────────────────────
  'orf-2',
  'orf-1',
  'orf-iii',
  'orf-sport-plus',
  'orf-2-europe',
  'orf-kids',

  // ── 2. Die führenden österreichischen Privatsender ────────────────────────
  'servus-tv',
  'atv',
  'puls-4',
  'atv2',
  'puls-24',
  'oe24-tv',
  'krone-tv',
  'kurier-tv',
  'exxpress-tv',

  // ── 3. Regional- & Spartenfernsehen Österreich ───────────────────────────
  'w24',
  'r9',
  'tirol-tv',
  'laendle-tv',
  'kt1',
  'k19',
  'okto',
  'wntv',
  'laola1-tv',
  'melodie-tv',

  // ── 4. Dreiländersender & Kultur ─────────────────────────────────────────
  '3sat',
  'arte',

  // ── 5. Deutsche Hauptsender in Österreich ────────────────────────────────
  'zdf',
  'das-erste',
  'rtl',
  'prosieben',
  'sat1',
  'vox',
  'kabel-eins',
  'rtl2',
  'zdf-neo',
  'super-rtl',
  'nitro',
  'sixx',
  'dmax',
  'prosieben-maxx',
  'sport1',
  'eurosport1',
];

export const AUSTRIA_HUB_CHANNELS = [
  { id: 'orf-1',          name: 'ORF 1' },
  { id: 'orf-2',          name: 'ORF 2' },
  { id: 'orf-iii',        name: 'ORF III' },
  { id: 'servus-tv',      name: 'ServusTV' },
  { id: 'atv',            name: 'ATV' },
  { id: 'puls-4',         name: 'PULS 4' },
  { id: 'atv2',           name: 'ATV2' },
  { id: 'puls-24',        name: 'PULS 24' },
  { id: 'orf-sport-plus', name: 'ORF Sport+' },
  { id: 'oe24-tv',        name: 'oe24.TV' },
  { id: 'krone-tv',       name: 'krone.tv' },
  { id: '3sat',           name: '3sat' },
  { id: 'das-erste',      name: 'Das Erste' },
  { id: 'zdf',            name: 'ZDF' },
  { id: 'rtl',            name: 'RTL' },
  { id: 'prosieben',      name: 'ProSieben' },
  { id: 'sat1',           name: 'SAT.1' },
];

const AUSTRIA_EXCLUSIVE_CHANNELS = new Set([
  'orf-1',
  'orf-2',
  'orf-2-europe',
  'orf-iii',
  'orf-sport-plus',
  'orf-kids',
  'servus-tv',
  'atv',
  'atv2',
  'puls-4',
  'puls-24',
  'oe24-tv',
  'krone-tv',
  'kurier-tv',
  'w24',
  'r9',
  'laola1-tv',
  'tirol-tv',
  'laendle-tv',
  'kt1',
  'k19',
  'okto',
  'wntv',
  'melodie-tv',
  'exxpress-tv',
]);

export function isAustriaExclusiveChannel(channelId: string, category?: string | null): boolean {
  if (category === 'oesterreich') return true;
  return AUSTRIA_EXCLUSIVE_CHANNELS.has(channelId);
}
