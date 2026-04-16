/**
 * URL delle pagine di live streaming ufficiali per ogni canale tedesco.
 *
 * login_required: la diretta richiede account
 * geo_de: accessibile solo da IP tedeschi
 */

export interface ChannelStream {
  url: string;
  login_required: boolean;
  geo_de: boolean;
  label?: string;
}

const CHANNEL_STREAMS: Record<string, ChannelStream> = {
  // ── ARD / ZDF / ÖR (gratuiti, geo-DE) ──────────────────────────────────────
  'das-erste':  { url: 'https://www.ardmediathek.de/live/das-erste',     login_required: false, geo_de: true,  label: 'ARD Mediathek' },
  'zdf':        { url: 'https://www.zdf.de/live-tv',                     login_required: false, geo_de: true,  label: 'ZDF' },
  'zdf-neo':    { url: 'https://www.zdf.de/live-tv',                     login_required: false, geo_de: true,  label: 'ZDF' },
  'zdfinfo':    { url: 'https://www.zdf.de/live-tv',                     login_required: false, geo_de: true,  label: 'ZDF' },
  'phoenix':    { url: 'https://www.ardmediathek.de/live/phoenix',       login_required: false, geo_de: true,  label: 'ARD Mediathek' },
  '3sat':       { url: 'https://www.3sat.de/live',                       login_required: false, geo_de: false, label: '3sat' },
  'arte':       { url: 'https://www.arte.tv/de/live',                    login_required: false, geo_de: false, label: 'ARTE' },
  'kika':       { url: 'https://www.kika.de/livestream',                 login_required: false, geo_de: true,  label: 'KiKA' },
  'ard-alpha':  { url: 'https://www.ardmediathek.de/live/ard-alpha',     login_required: false, geo_de: true,  label: 'ARD Mediathek' },
  'one':        { url: 'https://www.ardmediathek.de/live/one',           login_required: false, geo_de: true,  label: 'ARD Mediathek' },
  'tagesschau24':{ url: 'https://www.ardmediathek.de/live/tagesschau24', login_required: false, geo_de: false, label: 'ARD Mediathek' },

  // ── RTL-Gruppe (RTL+ — login gratuito) ───────────────────────────────────
  'rtl':        { url: 'https://plus.rtl.de/live-tv/rtl',               login_required: true,  geo_de: true,  label: 'RTL+' },
  'rtl2':       { url: 'https://plus.rtl.de/live-tv/rtl2',              login_required: true,  geo_de: true,  label: 'RTL+' },
  'vox':        { url: 'https://plus.rtl.de/live-tv/vox',               login_required: true,  geo_de: true,  label: 'RTL+' },
  'nitro':      { url: 'https://plus.rtl.de/live-tv/nitro',             login_required: true,  geo_de: true,  label: 'RTL+' },
  'super-rtl':  { url: 'https://plus.rtl.de/live-tv/superrtl',          login_required: true,  geo_de: true,  label: 'RTL+' },
  'ntv':        { url: 'https://plus.rtl.de/live-tv/ntv',               login_required: true,  geo_de: true,  label: 'RTL+' },
  'n-tv':       { url: 'https://plus.rtl.de/live-tv/ntv',               login_required: true,  geo_de: true,  label: 'RTL+' },

  // ── ProSiebenSat.1 (Joyn — login gratuito) ──────────────────────────────
  'sat1':       { url: 'https://www.sat1.de/live',                      login_required: false, geo_de: true,  label: 'SAT.1' },
  'prosieben':  { url: 'https://www.prosieben.de/live',                  login_required: false, geo_de: true,  label: 'ProSieben' },
  'kabel-eins': { url: 'https://www.kabeleins.de/live',                  login_required: false, geo_de: true,  label: 'Kabel Eins' },
  'sixx':       { url: 'https://www.sixx.de/live',                       login_required: false, geo_de: true,  label: 'sixx' },

  // ── Nachrichtenkanäle ────────────────────────────────────────────────────
  'welt':       { url: 'https://www.welt.de/tv-programm/live-stream/',   login_required: false, geo_de: false, label: 'WELT' },

  // ── Sport ────────────────────────────────────────────────────────────────
  'sport1':     { url: 'https://www.sport1.de/liveticker/livestream',    login_required: false, geo_de: true,  label: 'SPORT1' },
  'eurosport-1':{ url: 'https://www.discoveryplus.com/de/channel/eurosport1', login_required: true, geo_de: true, label: 'Discovery+' },

  // ── Tele 5 ───────────────────────────────────────────────────────────────
  'tele5':      { url: 'https://www.tele5.de/livetv',                    login_required: false, geo_de: true,  label: 'Tele 5' },
};

/** Ritorna i dati di streaming per un channel_id, o null se non disponibile. */
export function getChannelStream(channelId: string): ChannelStream | null {
  return CHANNEL_STREAMS[channelId] ?? null;
}
