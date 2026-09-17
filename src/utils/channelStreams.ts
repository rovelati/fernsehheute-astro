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
  'das-erste':  { url: 'https://www.daserste.de/live/index.html',        login_required: false, geo_de: true,  label: 'Das Erste' },
  'zdf':        { url: 'https://www.zdf.de/live-tv',                     login_required: false, geo_de: true,  label: 'ZDF' },
  'zdf-neo':    { url: 'https://www.zdf.de/live-tv',                     login_required: false, geo_de: true,  label: 'ZDF' },
  'zdfinfo':    { url: 'https://www.zdf.de/live-tv',                     login_required: false, geo_de: true,  label: 'ZDF' },
  'phoenix':    { url: 'https://www.phoenix.de/livestream.html',         login_required: false, geo_de: true,  label: 'Phoenix' },
  '3sat':       { url: 'https://www.3sat.de/programm',                   login_required: false, geo_de: false, label: '3sat' },
  'arte':       { url: 'https://www.arte.tv/de/live',                    login_required: false, geo_de: false, label: 'ARTE' },
  'kika':       { url: 'https://www.kika.de/livestream',                 login_required: false, geo_de: true,  label: 'KiKA' },
  'ard-alpha':  { url: 'https://www.ardmediathek.de/live',               login_required: false, geo_de: true,  label: 'ARD Mediathek' },
  'one':        { url: 'https://www.ardmediathek.de/live',               login_required: false, geo_de: true,  label: 'ARD Mediathek' },
  'tagesschau24':{ url: 'https://www.tagesschau.de/multimedia/livestreams/index.html', login_required: false, geo_de: false, label: 'Tagesschau24' },

  // ── RTL-Gruppe (RTL+ / RTL) ───────────────────────────────────────────────
  'rtl':        { url: 'https://plus.rtl.de/',                           login_required: true,  geo_de: true,  label: 'RTL+' },
  'rtl2':       { url: 'https://plus.rtl.de/',                           login_required: true,  geo_de: true,  label: 'RTL+' },
  'vox':        { url: 'https://plus.rtl.de/',                           login_required: true,  geo_de: true,  label: 'RTL+' },
  'nitro':      { url: 'https://plus.rtl.de/',                           login_required: true,  geo_de: true,  label: 'RTL+' },
  'super-rtl':  { url: 'https://plus.rtl.de/',                           login_required: true,  geo_de: true,  label: 'RTL+' },
  'ntv':        { url: 'https://www.n-tv.de/mediathek/livestream/',      login_required: false, geo_de: false, label: 'ntv' },
  'n-tv':       { url: 'https://www.n-tv.de/mediathek/livestream/',      login_required: false, geo_de: false, label: 'ntv' },

  // ── ProSiebenSat.1 (Joyn — login gratuito) ──────────────────────────────
  'sat1':       { url: 'https://www.sat1.de/live',                      login_required: false, geo_de: true,  label: 'SAT.1' },
  'prosieben':  { url: 'https://www.prosieben.de/live',                  login_required: false, geo_de: true,  label: 'ProSieben' },
  'kabel-eins': { url: 'https://www.kabeleins.de/live',                  login_required: false, geo_de: true,  label: 'Kabel Eins' },
  'sixx':       { url: 'https://www.sixx.de/live',                       login_required: false, geo_de: true,  label: 'sixx' },

  // ── Nachrichtenkanäle ────────────────────────────────────────────────────
  'welt':       { url: 'https://www.welt.de/tv-programm-live-stream/',   login_required: false, geo_de: false, label: 'WELT' },

  // ── Sport ────────────────────────────────────────────────────────────────
  'sport1':     { url: 'https://www.sport1.de/liveticker/livestream',    login_required: false, geo_de: true,  label: 'SPORT1' },

  // ── Tele 5 ───────────────────────────────────────────────────────────────
  'tele5':      { url: 'https://tele5.de/',                              login_required: false, geo_de: true,  label: 'Tele 5' },
};

/** Ritorna i dati di streaming per un channel_id, o null se non disponibile. */
export function getChannelStream(channelId: string): ChannelStream | null {
  return CHANNEL_STREAMS[channelId] ?? null;
}
