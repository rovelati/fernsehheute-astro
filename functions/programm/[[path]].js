/**
 * CF Pages Function — /programm/*
 *
 * Redirect permanently (301 Moved Permanently) from deprecated program-detail pages
 * (/programm/:channelSlug/:programSlug) to the live channel schedule page (/:channelSlug/).
 * This transfers SEO equity to channel hubs and resolves Google Search Console
 * "Excluded by 'noindex' tag" warnings.
 */

// Mappa alias noti storici -> slug canale canonico
const KNOWN_SLUG_MAP = {
  'daserste':            'das-erste',
  'de-das-erste':        'das-erste',
  'das-erste':           'das-erste',
  'zdf':                 'zdf',
  'zdf-neo':             'zdf-neo',
  'zdfneo':              'zdf-neo',
  'zdf-info':            'zdfinfo',
  'zdfinfo':             'zdfinfo',
  'rtl':                 'rtl',
  'rtl2':                'rtl2',
  'rtlzwei':             'rtl2',
  'sat1':                'sat1',
  'sat-1':               'sat1',
  'prosieben':           'prosieben',
  'pro7':                'prosieben',
  'vox':                 'vox',
  'kabel-eins':          'kabel-eins',
  'kabeleins':           'kabel-eins',
  'sport1':              'sport1',
  'sport1-2':            'sport1',
  'one':                 'one',
  'arte':                'arte',
  '3sat':                '3sat',
  'tele5':               'tele5',
  'dmax':                'dmax',
  'super-rtl':           'super-rtl',
  'nitro':               'nitro',
  'sixx':                'sixx',
  'n-tv':                'n-tv',
  'ntv':                 'n-tv',
  'welt':                'welt',
  'kika':                'kika',
  'phoenix':             'phoenix',
  'tagesschau24':        'tagesschau24',
  'ard-alpha':           'ard-alpha',
  'wedo-movies':         'wedo-movies',
  'wedo-sports':         'wedo-sports',
  'waidwerk-tv':         'waidwerk-tv',
  'waidwerk':            'waidwerk-tv',
  'oberpfalz-tv':        'oberpfalz-tv',
  'curiosity-channelcu': 'curiosity-channel',
  'curiosity-channel':   'curiosity-channel',
  'craction':            'actionfilme',
  'n24-doku':            'n24-doku',
};

function normalizeChannelSlug(raw) {
  if (!raw) return '';
  let s = String(raw).toLowerCase().trim();
  // Rimuovi prefissi 'de-' o 'de_'
  s = s.replace(/^de[-_]/, '');
  // Rimuovi suffisso '.de'
  s = s.replace(/\.de$/, '');
  // Umlaut replacement
  s = s.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
  // Pulizia caratteri non alfanumerici
  s = s.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  if (KNOWN_SLUG_MAP[s]) return KNOWN_SLUG_MAP[s];
  if (KNOWN_SLUG_MAP[raw.toLowerCase().trim()]) return KNOWN_SLUG_MAP[raw.toLowerCase().trim()];
  return s;
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  // pathname ad es. /programm/de-das-erste/brennpunkt-vier-jahre-krieg-in-der-ukraine
  const parts = url.pathname.split('/').filter(Boolean);

  // parts[0] === 'programm'
  const rawChannel = parts[1];

  let targetUrl = `${url.origin}/`;

  if (rawChannel) {
    const channelSlug = normalizeChannelSlug(rawChannel);
    if (channelSlug) {
      targetUrl = `${url.origin}/${channelSlug}/`;
    }
  }

  return Response.redirect(targetUrl, 301);
}
