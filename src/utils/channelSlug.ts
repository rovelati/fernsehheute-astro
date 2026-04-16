import type { HubChannel } from '../types';

const CHANNEL_SLUGS: Record<string, string> = {
  'rtl':          'rtl',
  'zdf':          'zdf',
  'das-erste':    'das-erste',
  'sat1':         'sat1',
  'prosieben':    'prosieben',
  'vox':          'vox',
  'rtl2':         'rtl2',
  'kabel-eins':   'kabel-eins',
  'sixx':         'sixx',
  'super-rtl':    'super-rtl',
  'nitro':        'nitro',
  'tele5':        'tele5',
  'welt':         'welt',
  'ntv':          'ntv',
  'n-tv':         'n-tv',
  'zdf-neo':      'zdf-neo',
  'zdfneo':       'zdf-neo',
  'zdfinfo':      'zdfinfo',
  'zdf-info':     'zdfinfo',
  '3sat':         '3sat',
  'arte':         'arte',
  'kika':         'kika',
  'phoenix':      'phoenix',
  'one':          'one',
  'tagesschau24': 'tagesschau24',
  'ard-alpha':    'ard-alpha',
  'sport1':       'sport1',
  'eurosport-1':  'eurosport-1',
  'dmax':         'dmax',
  'comedy-central': 'comedy-central',
  'disney-channel': 'disney-channel',
};

export const getChannelSlug = (channelId: string): string => {
  if (!channelId || typeof channelId !== 'string') return '';
  const normalized = channelId.toLowerCase();
  return CHANNEL_SLUGS[normalized] ?? normalized.replace(/\s+/g, '-');
};

export const getHubChannelUrl = (channelId: string): string =>
  `/${getChannelSlug(channelId)}`;

/** Canali TV principali tedeschi esposti come hub (ordine audience reach AGF 2025) */
export const HUB_CHANNELS: HubChannel[] = [
  { id: 'rtl',          name: 'RTL'         },
  { id: 'zdf',          name: 'ZDF'         },
  { id: 'das-erste',    name: 'Das Erste'   },
  { id: 'sat1',         name: 'SAT.1'       },
  { id: 'prosieben',    name: 'ProSieben'   },
  { id: 'vox',          name: 'VOX'         },
  { id: 'rtl2',         name: 'RTL2'        },
  { id: 'kabel-eins',   name: 'Kabel Eins'  },
  { id: 'sixx',         name: 'sixx'        },
  { id: 'super-rtl',    name: 'Super RTL'   },
  { id: 'nitro',        name: 'NITRO'       },
  { id: 'tele5',        name: 'Tele 5'      },
  { id: 'zdf-neo',      name: 'ZDFneo'      },
  { id: 'zdfinfo',      name: 'ZDFinfo'     },
  { id: '3sat',         name: '3sat'        },
  { id: 'arte',         name: 'ARTE'        },
  { id: 'phoenix',      name: 'phoenix'     },
  { id: 'one',          name: 'One'         },
  { id: 'sport1',       name: 'SPORT1'      },
  { id: 'dmax',         name: 'DMAX'        },
];
