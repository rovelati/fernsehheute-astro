/**
 * Risolve il logo di un canale con priorità ai loghi vettoriali SVG / PNG locali in /channel-logos/.
 * Include normalizzazione automatica dei prefissi "DE -", suffissi ".de", trattini e alias.
 */

const normalizeKey = (s?: string | null): string => {
  if (!s) return '';
  return s
    .toLowerCase()
    .trim()
    .replace(/^de\s*[-–:]\s*/i, '')
    .replace(/^de-/i, '')
    .replace(/\.de$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const LOCAL_LOGOS: Record<string, string> = {
  // ── ARD / ZDF / ÖR ──────────────────────────────────────────────────────────
  'das-erste':              '/channel-logos/das-erste.svg',
  'daserste':               '/channel-logos/das-erste.svg',
  'ard':                    '/channel-logos/ard.svg',
  'ard-alpha':              '/channel-logos/ard-alpha.svg',
  'ardalpha':               '/channel-logos/ard-alpha.svg',
  'zdf':                    '/channel-logos/zdf.svg',
  'zdf-neo':                '/channel-logos/zdf-neo.svg',
  'zdfneo':                 '/channel-logos/zdf-neo.svg',
  'zdfinfo':                '/channel-logos/zdfinfo.svg',
  'zdf-info':               '/channel-logos/zdfinfo.svg',
  'phoenix':                '/channel-logos/phoenix.svg',
  '3sat':                   '/channel-logos/3sat.svg',
  'kika':                   '/channel-logos/kika.svg',
  'arte':                   '/channel-logos/arte.svg',
  'one':                    '/channel-logos/one.png',
  'onede':                  '/channel-logos/one.png',
  'tagesschau24':           '/channel-logos/tagesschau24de.svg',
  'tagesschau-24':          '/channel-logos/tagesschau24de.svg',

  // ── ARD Regionalanstalten ───────────────────────────────────────────────────
  'wdr':                    '/channel-logos/wdr.svg',
  'wdr-aachen':             '/channel-logos/wdr.svg',
  'wdr-koln':               '/channel-logos/wdr.svg',
  'wdr-dusseldorf':         '/channel-logos/wdr.svg',
  'ndr':                    '/channel-logos/ndr.svg',
  'ndr-hamburg':            '/channel-logos/ndr.svg',
  'ndr-hannover':           '/channel-logos/ndr.svg',
  'mdr':                    '/channel-logos/mdr.svg',
  'mdr-sachsen':            '/channel-logos/mdr.svg',
  'mdr-thuringen':          '/channel-logos/mdr.svg',
  'br':                     '/channel-logos/br.svg',
  'br-fernsehen':           '/channel-logos/br.svg',
  'br-fernsehen-nord':      '/channel-logos/br.svg',
  'br-fernsehen-sud':       '/channel-logos/br.svg',
  'hr':                     '/channel-logos/hr.svg',
  'hr-fernsehen':           '/channel-logos/hr.svg',
  'rbb':                    '/channel-logos/rbb.svg',
  'rbb-berlin':             '/channel-logos/rbb.svg',
  'rbb-brandenburg':        '/channel-logos/rbb.svg',
  'swr':                    '/channel-logos/swr.svg',
  'swr-fernsehen':          '/channel-logos/swr.svg',
  'swr-bw':                 '/channel-logos/swr.svg',
  'swr-rp':                 '/channel-logos/swr.svg',

  // ── RTL-Gruppe ─────────────────────────────────────────────────────────────
  'rtl':                    '/channel-logos/rtl.svg',
  'rtlde':                  '/channel-logos/rtl.svg',
  'rtl2':                   '/channel-logos/rtl2.svg',
  'rtl-2':                  '/channel-logos/rtl2.svg',
  'rtl-ii':                 '/channel-logos/rtl-ii.svg',
  'super-rtl':              '/channel-logos/super-rtl.svg',
  'superrtl':               '/channel-logos/super-rtl.svg',
  'vox':                    '/channel-logos/vox.svg',
  'voxde':                  '/channel-logos/vox.svg',
  'voxup':                  '/channel-logos/vox.svg',
  'vox-up':                 '/channel-logos/vox.svg',
  'nitro':                  '/channel-logos/nitro.png',
  'nitrode':                '/channel-logos/nitro.png',
  'rtl-up':                 '/channel-logos/rtl.svg',
  'rtlup':                  '/channel-logos/rtl.svg',
  'toggo-plus':             '/channel-logos/super-rtl.svg',

  // ── ProSiebenSat.1 ──────────────────────────────────────────────────────────
  'sat1':                   '/channel-logos/sat1.svg',
  'sat-1':                  '/channel-logos/sat1.svg',
  'sat1de':                 '/channel-logos/sat1.svg',
  'sat-1-gold':             '/channel-logos/sat1.svg',
  'sat1-gold':              '/channel-logos/sat1.svg',
  'prosieben':              '/channel-logos/prosieben.svg',
  'pro-sieben':             '/channel-logos/prosieben.svg',
  'prosiebende':            '/channel-logos/prosieben.svg',
  'pro7':                   '/channel-logos/pro7.svg',
  'prosieben-maxx':         '/channel-logos/prosieben.svg',
  'pro7-maxx':              '/channel-logos/prosieben.svg',
  'kabel-eins':             '/channel-logos/kabel-eins.svg',
  'kabeleins':              '/channel-logos/kabeleins.svg',
  'kabel1':                 '/channel-logos/kabeleins.svg',
  'kabel-1':                '/channel-logos/kabeleins.svg',
  'kabel-eins-classics':    '/channel-logos/kabel-eins-classics.png',
  'kabeleinsclassics':      '/channel-logos/kabel-eins-classics.png',
  'kabel-eins-doku':        '/channel-logos/kabel-eins-doku.png',
  'kabeleinsdoku':          '/channel-logos/kabel-eins-doku.png',
  'sixx':                   '/channel-logos/sixx.svg',
  'sixxde':                 '/channel-logos/sixx.svg',

  // ── Nachrichtenkanäle ────────────────────────────────────────────────────────
  'welt':                   '/channel-logos/welt.svg',
  'weltde':                 '/channel-logos/welt.svg',
  'n-tv':                   '/channel-logos/n-tv.svg',
  'ntv':                    '/channel-logos/ntv.svg',
  'n24-doku':               '/channel-logos/n24-doku.svg',
  'n24':                    '/channel-logos/n24-doku.svg',

  // ── Sport ────────────────────────────────────────────────────────────────────
  'sport1':                 '/channel-logos/sport1de.png',
  'sport1de':               '/channel-logos/sport1de.png',
  'sport-1':                '/channel-logos/sport1de.png',
  'eurosport-1':            '/channel-logos/eurosport-1.png',
  'eurosport1':             '/channel-logos/eurosport-1.png',
  'eurosport-2':            '/channel-logos/eurosport-2.png',
  'eurosport2':             '/channel-logos/eurosport-2.png',
  'dazn':                   '/channel-logos/dazn.png',
  'dazn-1':                 '/channel-logos/dazn.png',
  'dazn-2':                 '/channel-logos/dazn.png',
  'esports1':               '/channel-logos/esports1.png',
  'sportdigital-fussball':   '/channel-logos/sportdigital-fussball.png',
  'more-than-sports-tv':    '/channel-logos/more-than-sports-tv.png',

  // ── Discovery / DMAX ────────────────────────────────────────────────────────
  'dmax':                   '/channel-logos/dmax.png',
  'dmaxde':                 '/channel-logos/dmax.png',
  'tlc':                    '/channel-logos/tlc.png',
  'tlcde':                  '/channel-logos/tlc.png',
  'discovery-hd':           '/channel-logos/discovery-hd.png',
  'discovery':              '/channel-logos/discovery-hd.png',
  'nat-geo-hd':             '/channel-logos/nat-geo-hd.png',
  'nat-geo-wild':           '/channel-logos/nat-geo-wild.png',

  // ── Sky ──────────────────────────────────────────────────────────────────────
  'sky-one':                    '/channel-logos/sky-one.png',
  'sky-atlantic-hd':            '/channel-logos/sky-atlantic-hd.png',
  'sky-nature':                 '/channel-logos/sky-nature.png',
  'sky-crime':                  '/channel-logos/sky-crime.png',
  'sky-documentaries':          '/channel-logos/sky-documentaries.png',
  'sky-cinema-premiere-hd':     '/channel-logos/sky-cinema-premiere-hd.png',
  'sky-cinema-family-hd':       '/channel-logos/sky-cinema-family-hd.png',
  'sky-cinema-action-hd':       '/channel-logos/sky-cinema-action-hd.png',
  'sky-cinema-classics-hd':     '/channel-logos/sky-cinema-classics-hd.png',
  'sky-cinema-highlights-hd':   '/channel-logos/sky-cinema-highlights-hd.png',

  // ── Weitere Unterhaltung / Spielfilme ─────────────────────────────────────────
  'tele5':                  '/channel-logos/tele-5.svg',
  'tele-5':                 '/channel-logos/tele-5.svg',
  'comedy-central':         '/channel-logos/comedy-central.png',
  'comedycentral':          '/channel-logos/comedy-central.png',
  'disney-channel':         '/channel-logos/disney-channel.png',
  'disneychannel':          '/channel-logos/disney-channel.png',
  'nick':                   '/channel-logos/nick.png',
  'nickelodeon':            '/channel-logos/nick.png',
  'nick-jr':                '/channel-logos/nick-jr.png',
  'cartoon-network':        '/channel-logos/cartoon-network.png',
  'mtv':                    '/channel-logos/mtv.png',
  'mtvde':                  '/channel-logos/mtv.png',
  'syfy':                   '/channel-logos/syfy.png',
  'anixe':                  '/channel-logos/anixe.png',
  'anixe-hd':               '/channel-logos/anixe.png',
  'romance-tv':             '/channel-logos/romance-tv.png',
  'spiegel-geschichte':     '/channel-logos/spiegel-geschichte.png',
  'the-history-channel':    '/channel-logos/the-history-channel.png',
  'servus-tv-osterreich':   '/channel-logos/servus-tv-osterreich.png',
  'servustv':               '/channel-logos/servus-tv-osterreich.png',
  'heimatkanal':            '/channel-logos/heimatkanal.png',
  'bibel-tv':               '/channel-logos/bibel-tv.png',
  'warner-tv-comedy':       '/channel-logos/warner-tv-comedy.png',
  'warner-tv-film':         '/channel-logos/warner-tv-film.png',
  'warner-tv-serie':        '/channel-logos/warner-tv-serie.png',
  'deluxe-music':           '/channel-logos/deluxe-music.png',
  'deluxemusic':            '/channel-logos/deluxe-music.png',
};

export const getChannelLogo = (channelId?: string | null, logoUrl?: string | null, channelName?: string | null): string => {
  const normId   = normalizeKey(channelId);
  const normName = normalizeKey(channelName);
  const rawId    = (channelId || '').toLowerCase().trim();

  // 1. Cerca nei loghi locali mappati per slug ID
  if (normId && LOCAL_LOGOS[normId]) return LOCAL_LOGOS[normId];

  // 2. Cerca per slug Nome
  if (normName && LOCAL_LOGOS[normName]) return LOCAL_LOGOS[normName];

  // 3. Cerca per raw ID
  if (rawId && LOCAL_LOGOS[rawId]) return LOCAL_LOGOS[rawId];

  // 4. Se nel DB c'è un path che punta a /channel-logos/ locale
  if (logoUrl?.includes('/channel-logos/')) {
    const filename = logoUrl.split('/channel-logos/').pop();
    if (filename) return `/channel-logos/${filename}`;
  }

  // 5. Logo remoto valido fornito da EPG
  if (logoUrl && logoUrl.startsWith('http') && !logoUrl.includes('null')) {
    return logoUrl;
  }

  // 6. Fallback dinamico generato con badge SVG inline
  const initials = ((channelName || channelId || 'TV').replace(/^DE\s*-\s*/i, '').trim().slice(0, 3) || 'TV').toUpperCase();
  const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1e293b"/><stop offset="100%" stop-color="#0f172a"/></linearGradient></defs><rect width="100" height="100" rx="16" fill="url(#g)"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#38bdf8" font-family="system-ui,-apple-system,sans-serif" font-weight="900" font-size="28" letter-spacing="1">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(fallbackSvg)}`;
};

