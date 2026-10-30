/**
 * SWISS_ORDER — Rangliste der TV-Sender in der Deutschschweiz nach Reichweite und Relevanz.
 *
 * 1. Schweizer öffentlich-rechtliche Hauptprogramme (SRG SSR):
 *    SRF 1 (~19-20% MA), SRF zwei (~8-10% MA), SRF info
 * 2. Schweizer Privatsender (CH Media, Entertainment):
 *    3+ (groesster Schweizer Privatsender), 4+, TV24, TV25, Puls 8, SWISS 1, 5+, 6+, 7+, Star TV
 * 3. Schweizer Regionalfernsehen:
 *    TeleZüri, Tele Bärn, Tele 1, Tele M1, Tele Top, Telebasel, TeleBielingue, Tele Z, Tele D, Teleswizz
 * 4. Dreiländersender & Kultur:
 *    3sat (ZDF/ORF/SRF), ARTE
 * 5. Beliebteste deutsche Vollprogramme im Schweizer Kabel- & IPTV-Netz (Swisscom blue, Sunrise, UPC):
 *    ZDF, Das Erste, RTL, ProSieben, SAT.1, VOX, Kabel Eins, RTL ZWEI, ZDFneo, Super RTL, NITRO, sixx
 */

export const SWISS_ORDER: string[] = [
  // ── 1. SRG SSR (Schweizer Radio und Fernsehen) ───────────────────────────
  'srf-1',
  'srf-zwei',
  'srf-info',

  // ── 2. Die führenden Schweizer Privatsender ──────────────────────────────
  '3plus',
  '4plus',
  'tv24',
  'tv25',
  'puls-8',
  'swiss-1',
  '5plus',
  '6plus',
  '7plus',
  'star-tv',

  // ── 3. Regionalfernsehen Deutschschweiz ──────────────────────────────────
  'telezueri',
  'tele-baern',
  'tele-1',
  'tele-m1',
  'tele-top',
  'telebasel',
  'telebielingue',
  'tele-z',
  'tele-d',
  'teleswizz',

  // ── 4. Dreiländersender & Kultur ─────────────────────────────────────────
  '3sat',
  'arte',

  // ── 5. Deutsche Hauptsender in der Schweiz ───────────────────────────────
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

export const SWISS_HUB_CHANNELS = [
  { id: 'srf-1',     name: 'SRF 1'    },
  { id: 'srf-zwei',  name: 'SRF zwei' },
  { id: 'srf-info',  name: 'SRF info' },
  { id: '3plus',     name: '3+'       },
  { id: '4plus',     name: '4+'       },
  { id: 'tv24',      name: 'TV24'     },
  { id: 'tv25',      name: 'TV25'     },
  { id: 'puls-8',    name: 'Puls 8'   },
  { id: 'swiss-1',   name: 'SWISS 1'  },
  { id: 'telezueri', name: 'TeleZüri' },
  { id: 'tele-baern', name: 'Tele Bärn' },
  { id: 'telebasel', name: 'Telebasel' },
  { id: '3sat',      name: '3sat'     },
  { id: 'das-erste', name: 'Das Erste'},
  { id: 'zdf',       name: 'ZDF'      },
  { id: 'rtl',       name: 'RTL'      },
  { id: 'prosieben', name: 'ProSieben'},
  { id: 'sat1',      name: 'SAT.1'    },
];

const SWISS_EXCLUSIVE_CHANNELS = new Set([
  'srf-1',
  'srf-zwei',
  'srf-info',
  '3plus',
  '4plus',
  '5plus',
  '6plus',
  '7plus',
  'tv24',
  'tv25',
  'puls-8',
  'swiss-1',
  'star-tv',
  'telezueri',
  'tele-baern',
  'tele-1',
  'tele-m1',
  'tele-top',
  'telebasel',
  'telebielingue',
  'tele-z',
  'tele-d',
  'teleswizz',
]);

export function isSwissExclusiveChannel(channelId: string, category?: string | null): boolean {
  if (category === 'schweiz') return true;
  return SWISS_EXCLUSIVE_CHANNELS.has(channelId);
}
