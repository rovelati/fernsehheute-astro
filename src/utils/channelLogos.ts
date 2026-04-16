/**
 * Risolve il logo di un canale con fallback a /channel-logos/ (Cloudflare Pages CDN).
 * I loghi locali sono in public/channel-logos/ — copiati da frontend/public/logos/.
 */

const LOCAL_LOGOS: Record<string, string> = {
  // ── ARD / ZDF / ÖR ──────────────────────────────────────────────────────────
  'das-erste':          '/channel-logos/das-erste.svg',
  'ard':                '/channel-logos/ard.svg',
  'ard-alpha':          '/channel-logos/ard-alpha.svg',
  'zdf':                '/channel-logos/zdf.svg',
  'zdf-neo':            '/channel-logos/zdf-neo.svg',
  'zdfneo':             '/channel-logos/zdfneo.svg',
  'zdfinfo':            '/channel-logos/zdfinfo.svg',
  'phoenix':            '/channel-logos/phoenix.svg',
  '3sat':               '/channel-logos/3sat.svg',
  'kika':               '/channel-logos/kika.svg',
  'arte':               '/channel-logos/arte.svg',
  'one':                '/channel-logos/one.png',
  'onede':              '/channel-logos/one.png',
  'tagesschau24':       '/channel-logos/tagesschau24de.svg',
  'tagesschau24de':     '/channel-logos/tagesschau24de.svg',
  // ── ARD Regionalanstalten ───────────────────────────────────────────────────
  'wdr':                '/channel-logos/wdr.svg',
  'ndr':                '/channel-logos/ndr.svg',
  'mdr':                '/channel-logos/mdr.svg',
  'br':                 '/channel-logos/br.svg',
  'hr':                 '/channel-logos/hr.svg',
  'rbb':                '/channel-logos/rbb.svg',
  'swr':                '/channel-logos/swr.svg',
  // ── RTL-Gruppe ─────────────────────────────────────────────────────────────
  'rtl':                '/channel-logos/rtl.svg',
  'rtlde':              '/channel-logos/rtl.svg',
  'rtl2':               '/channel-logos/rtl2.svg',
  'rtl-ii':             '/channel-logos/rtl-ii.svg',
  'super-rtl':          '/channel-logos/super-rtl.svg',
  'vox':                '/channel-logos/vox.svg',
  'voxde':              '/channel-logos/vox.svg',
  'nitro':              '/channel-logos/nitro.png',
  'nitrode':            '/channel-logos/nitro.png',
  // ── ProSiebenSat.1 ──────────────────────────────────────────────────────────
  'sat1':               '/channel-logos/sat1.svg',
  'sat1de':             '/channel-logos/sat1.svg',
  'sat.1':              '/channel-logos/sat1.svg',
  'prosieben':          '/channel-logos/prosieben.svg',
  'prosiebende':        '/channel-logos/prosieben.svg',
  'pro7':               '/channel-logos/pro7.svg',
  'kabel-eins':         '/channel-logos/kabel-eins.svg',
  'kabeleins':          '/channel-logos/kabeleins.svg',
  'sixx':               '/channel-logos/sixx.svg',
  'sixxde':             '/channel-logos/sixx.svg',
  'kabel-eins-classics':'/channel-logos/kabel-eins-classics.png',
  'kabel-eins-doku':    '/channel-logos/kabel-eins-doku.png',
  // ── Nachrichtenkanäle ────────────────────────────────────────────────────────
  'welt':               '/channel-logos/welt.svg',
  'weltde':             '/channel-logos/welt.svg',
  'n-tv':               '/channel-logos/n-tv.svg',
  'ntv':                '/channel-logos/ntv.svg',
  'n24-doku':           '/channel-logos/n24-doku.svg',
  // ── Sport ────────────────────────────────────────────────────────────────────
  'sport1':             '/channel-logos/sport1de.png',
  'sport1de':           '/channel-logos/sport1de.png',
  'eurosport-1':        '/channel-logos/eurosport-1.png',
  'eurosport-2':        '/channel-logos/eurosport-2.png',
  'dazn':               '/channel-logos/dazn.png',
  'esports1':           '/channel-logos/esports1.png',
  'sportdigital-fussball': '/channel-logos/sportdigital-fussball.png',
  'more-than-sports-tv':'/channel-logos/more-than-sports-tv.png',
  // ── Discovery / DMAX ────────────────────────────────────────────────────────
  'dmax':               '/channel-logos/dmax.png',
  'dmaxde':             '/channel-logos/dmax.png',
  'tlc':                '/channel-logos/tlc.png',
  'tlcde':              '/channel-logos/tlc.png',
  'discovery-hd':       '/channel-logos/discovery-hd.png',
  'nat-geo-hd':         '/channel-logos/nat-geo-hd.png',
  'nat-geo-wild':       '/channel-logos/nat-geo-wild.png',
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
  // ── Weitere ──────────────────────────────────────────────────────────────────
  'tele5':              '/channel-logos/tele-5.svg',
  'tele-5':             '/channel-logos/tele-5.svg',
  'comedy-central':     '/channel-logos/comedy-central.png',
  'disney-channel':     '/channel-logos/disney-channel.png',
  'nick':               '/channel-logos/nick.png',
  'nick-jr':            '/channel-logos/nick-jr.png',
  'cartoon-network':    '/channel-logos/cartoon-network.png',
  'mtv':                '/channel-logos/mtv.png',
  'mtvde':              '/channel-logos/mtv.png',
  'syfy':               '/channel-logos/syfy.png',
  'anixe':              '/channel-logos/anixe.png',
  'romance-tv':         '/channel-logos/romance-tv.png',
  'spiegel-geschichte': '/channel-logos/spiegel-geschichte.png',
  'the-history-channel':'/channel-logos/the-history-channel.png',
  'servus-tv-osterreich':'/channel-logos/servus-tv-osterreich.png',
  'heimatkanal':        '/channel-logos/heimatkanal.png',
  'bibel-tv':           '/channel-logos/bibel-tv.png',
  'warner-tv-comedy':   '/channel-logos/warner-tv-comedy.png',
  'warner-tv-film':     '/channel-logos/warner-tv-film.png',
  'warner-tv-serie':    '/channel-logos/warner-tv-serie.png',
};

const GENERIC_LOGO =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y4ZmFmYyIgcng9IjgiLz48dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2NiZDVlMSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VFY8L3RleHQ+PC9zdmc+';

export const getChannelLogo = (channelId: string, logoUrl?: string | null, _channelName?: string): string => {
  const id = channelId?.toLowerCase().trim();

  // 1. Logo locale (massima priorità)
  if (id && LOCAL_LOGOS[id]) return LOCAL_LOGOS[id];

  // 2. Se il DB ha un URL che punta al vecchio dominio, converti in locale
  if (logoUrl?.includes('fernsehheute.de/channel-logos/')) {
    const filename = logoUrl.split('/channel-logos/').pop();
    if (filename) return `/channel-logos/${filename}`;
  }

  // 3. URL esterno dal DB
  if (logoUrl && logoUrl.trim() && !logoUrl.includes('fernsehheute.de') && logoUrl !== 'null') {
    return logoUrl;
  }

  // 4. Fallback per channel_id nel path locale
  if (id) return `/channel-logos/${id}.png`;

  return GENERIC_LOGO;
};
