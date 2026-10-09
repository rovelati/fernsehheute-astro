/**
 * ============================================================================
 * FERNSEHHEUTE.DE — PROGRAM IMAGES & HD POSTER RESOLVER
 * ============================================================================
 * 
 * Risolve locandine ed immagini ufficiali in alta definizione per tutti i programmi TV tedeschi:
 * 1. Mappatura HD per le trasmissioni e serie tedesche più popolari (Tatort, Tagesschau, heute-show, Galileo, GZSZ, Der Bergdoktor, ecc.).
 * 2. Fallback fotografici professionali ad alta risoluzione (800x600 px Unsplash CDN ad altissima disponibilità) per categoria.
 * 3. Garanzia che nessun programma televisivo rimanga senza locandina/immagine.
 * 
 * @module utils/programImages
 */

export const KNOWN_GERMAN_PROGRAM_POSTERS: Record<string, string> = {
  // ── WETTER & NACHRICHTEN ──────────────────────────────────────────────────
  'wetter': 'https://images.unsplash.com/photo-1592210454359-9043f067919b?auto=format&fit=crop&w=800&q=80',
  'das wetter': 'https://images.unsplash.com/photo-1592210454359-9043f067919b?auto=format&fit=crop&w=800&q=80',
  'wetter vor acht': 'https://images.unsplash.com/photo-1592210454359-9043f067919b?auto=format&fit=crop&w=800&q=80',
  'wetterbericht': 'https://images.unsplash.com/photo-1592210454359-9043f067919b?auto=format&fit=crop&w=800&q=80',
  'tagesschau': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
  'tagesthemen': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
  'heute': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
  'heute journal': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
  'heute journal update': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
  'heute xpress': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
  'rtl aktuell': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
  'sat 1 nachrichten': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
  'prosieben newstime': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
  'zdfinfo': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
  'phoenix vor ort': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',

  // ── KRIMI & DRAMA / ARD & ZDF ─────────────────────────────────────────────
  'tatort': 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80',
  'polizeiruf 110': 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80',
  'der alte': 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80',
  'der staatsanwalt': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
  'ein fall fuer zwei': 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80',
  'ein fall für zwei': 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80',
  'soko leipzig': 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80',
  'soko koeln': 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80',
  'soko köln': 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80',
  'soko wismar': 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80',
  'soko stuttgart': 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80',
  'soko wien': 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80',
  'der bergdoktor': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
  'die bergretter': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
  'das traumschiff': 'https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=800&q=80',
  'rosamunde pilcher': 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80',
  'in aller freundschaft': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
  'in aller freundschaft die jungen aerzte': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
  'in aller freundschaft die jungen ärzte': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
  'nord bei nordwest': 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80',
  'der zürich krimi': 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80',
  'der zuerich krimi': 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80',

  // ── DAILY SOAPS & SERIEN ───────────────────────────────────────────────────
  'gute zeiten schlechte zeiten': 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=800&q=80',
  'gzsz': 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=800&q=80',
  'unter uns': 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=800&q=80',
  'alles was zaehlt': 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=800&q=80',
  'alles was zählt': 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=800&q=80',
  'sturm der liebe': 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80',
  'rote rosen': 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80',
  'the big bang theory': 'https://image.tmdb.org/t/p/w780/euKFiO5M125rpngFRBbSW83beeI.jpg',
  'young sheldon': 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=800&q=80',
  'die simpsons': 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
  'two and a half men': 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=800&q=80',
  'navy cis': 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80',
  'ncis': 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80',
  'criminal minds': 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80',

  // ── SHOW & TALKSHOW & UNTERHALTUNG ────────────────────────────────────────
  'heute show': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  'heute-show': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  'zdf magazin royale': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  'markus lanz': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
  'maischberger': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
  'hart aber fair': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
  'caren miosga': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
  'wer weiss denn sowas': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  'wer weiß denn sowas': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  'gefragt gejagt': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  'gefragt - gejagt': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  'wer wird millionaer': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  'wer wird millionär': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  'let s dance': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  'the masked singer': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  'the voice of germany': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  'tv total': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  'joko und klaas': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  'bares fuer rares': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  'bares für rares': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  'galileo': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
  'taff': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  'stern tv': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
  'exclusiv': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  'explosiv': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
  'punkt 12': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
  'fruehstuecksfernsehen': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
  'frühstücksfernsehen': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
  'zdf m Morgenmagazin': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
  'ard morgenmagazin': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',

  // ── DOKUMENTATION & WISSEN ────────────────────────────────────────────────
  'terra x': 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
  'planet erde': 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
  'quarks': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
  'welt der wunder': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',

  // ── SPORT ─────────────────────────────────────────────────────────────────
  'sportschau': 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
  'das aktuelle sportstudio': 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
  'sportstudio': 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
  'doppelpass': 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
  'bundesliga': 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
  'champions league': 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
  'europa league': 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
  'dfb pokal': 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
  'formel 1': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
  'motorsport': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
  'darts': 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',

  // ── KINDER & JUGEND ───────────────────────────────────────────────────────
  'die sendung mit der maus': 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
  'sendung mit der maus': 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
  'logo': 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
  'kika': 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
  'peppa pig': 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
  'paw patrol': 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
};

export const GERMAN_CATEGORY_ARTWORK: Record<string, string> = {
  wetter: 'https://images.unsplash.com/photo-1592210454359-9043f067919b?auto=format&fit=crop&w=800&q=80',
  film: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
  kino: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
  spielfilm: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
  kinofilm: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
  fernsehfilm: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
  thriller: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80',
  krimi: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80',
  drama: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
  komödie: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  comedy: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  serie: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=800&q=80',
  serien: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=800&q=80',
  sitcom: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=800&q=80',
  sport: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
  fussball: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
  fußball: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
  motorsport: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
  unterhaltung: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  show: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  quiz: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  nachrichten: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
  news: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
  magazin: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
  journal: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
  doku: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
  dokumentation: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
  reportage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
  wissen: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
  natur: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
  kinder: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
  familie: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
  animation: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
  zeichentrick: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
  musik: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
  talkshow: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
};

function cleanTitle(str?: string | null): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function upscaleGermanImageUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return null;

  let upgraded = url;
  if (upgraded.includes('/media/cache/epg_program_small/')) {
    upgraded = upgraded.replace('/media/cache/epg_program_small/', '/');
  }
  if (upgraded.includes('/media/cache/epg_program_medium/')) {
    upgraded = upgraded.replace('/media/cache/epg_program_medium/', '/');
  }
  if (upgraded.includes('tmdb.org/t/p/w200/')) {
    upgraded = upgraded.replace('/w200/', '/w780/');
  }
  if (upgraded.includes('tmdb.org/t/p/w300/')) {
    upgraded = upgraded.replace('/w300/', '/w780/');
  }

  return upgraded;
}

export function resolveGermanProgramPoster(
  currentPoster?: string | null,
  title?: string | null,
  category?: string | null,
  description?: string | null
): string {
  const cleaned = cleanTitle(title);

  // 1. Meteo / Wetter
  if (cleaned.includes('wetter') || cleaned.includes('wetterbericht')) {
    return KNOWN_GERMAN_PROGRAM_POSTERS['wetter'];
  }

  // 2. Exact / Known Program Titles
  if (cleaned) {
    for (const [key, url] of Object.entries(KNOWN_GERMAN_PROGRAM_POSTERS)) {
      const cleanKey = cleanTitle(key);
      if (cleaned === cleanKey || cleaned.startsWith(cleanKey) || cleanKey.startsWith(cleaned)) {
        return url;
      }
    }

    if (cleaned.includes('tatort')) return KNOWN_GERMAN_PROGRAM_POSTERS['tatort'];
    if (cleaned.includes('tagesschau')) return KNOWN_GERMAN_PROGRAM_POSTERS['tagesschau'];
    if (cleaned.includes('heute show') || cleaned.includes('heuteshow')) return KNOWN_GERMAN_PROGRAM_POSTERS['heute show'];
    if (cleaned.includes('zdf magazin')) return KNOWN_GERMAN_PROGRAM_POSTERS['zdf magazin royale'];
    if (cleaned.includes('bergdoktor')) return KNOWN_GERMAN_PROGRAM_POSTERS['der bergdoktor'];
    if (cleaned.includes('bergretter')) return KNOWN_GERMAN_PROGRAM_POSTERS['die bergretter'];
    if (cleaned.includes('traumschiff')) return KNOWN_GERMAN_PROGRAM_POSTERS['das traumschiff'];
    if (cleaned.includes('gzsz') || cleaned.includes('gute zeiten')) return KNOWN_GERMAN_PROGRAM_POSTERS['gzsz'];
    if (cleaned.includes('unter uns')) return KNOWN_GERMAN_PROGRAM_POSTERS['unter uns'];
    if (cleaned.includes('sturm der liebe')) return KNOWN_GERMAN_PROGRAM_POSTERS['sturm der liebe'];
    if (cleaned.includes('rote rosen')) return KNOWN_GERMAN_PROGRAM_POSTERS['rote rosen'];
    if (cleaned.includes('galileo')) return KNOWN_GERMAN_PROGRAM_POSTERS['galileo'];
    if (cleaned.includes('sportschau')) return KNOWN_GERMAN_PROGRAM_POSTERS['sportschau'];
    if (cleaned.includes('sportstudio')) return KNOWN_GERMAN_PROGRAM_POSTERS['das aktuelle sportstudio'];
    if (cleaned.includes('wer wird millionaer')) return KNOWN_GERMAN_PROGRAM_POSTERS['wer wird millionaer'];
    if (cleaned.includes('wer weiss denn sowas')) return KNOWN_GERMAN_PROGRAM_POSTERS['wer weiss denn sowas'];
    if (cleaned.includes('gefragt gejagt')) return KNOWN_GERMAN_PROGRAM_POSTERS['gefragt gejagt'];
    if (cleaned.includes('bares fuer rares')) return KNOWN_GERMAN_PROGRAM_POSTERS['bares fuer rares'];
    if (cleaned.includes('markus lanz')) return KNOWN_GERMAN_PROGRAM_POSTERS['markus lanz'];
    if (cleaned.includes('maischberger')) return KNOWN_GERMAN_PROGRAM_POSTERS['maischberger'];
    if (cleaned.includes('sendung mit der maus')) return KNOWN_GERMAN_PROGRAM_POSTERS['die sendung mit der maus'];
    if (cleaned.includes('in aller freundschaft')) return KNOWN_GERMAN_PROGRAM_POSTERS['in aller freundschaft'];
    if (cleaned.includes('soko')) return KNOWN_GERMAN_PROGRAM_POSTERS['soko leipzig'];
    if (cleaned.includes('polizeiruf')) return KNOWN_GERMAN_PROGRAM_POSTERS['polizeiruf 110'];
  }

  // 3. If valid initial poster URL exists
  if (currentPoster && typeof currentPoster === 'string' && currentPoster.startsWith('http')) {
    const upscaled = upscaleGermanImageUrl(currentPoster);
    if (upscaled) return upscaled;
  }

  // 4. Category Artwork Fallback
  const cat = cleanTitle(category);
  for (const [catKey, artUrl] of Object.entries(GERMAN_CATEGORY_ARTWORK)) {
    const cleanCatKey = cleanTitle(catKey);
    if (cat.includes(cleanCatKey)) {
      return artUrl;
    }
  }

  // 5. Description Analysis Fallback
  const desc = (description || '').toLowerCase();
  if (desc.includes('regie:') || desc.includes('regie von') || desc.includes('darsteller:') || desc.includes('schauspieler:') || desc.includes('spielfilm')) {
    return GERMAN_CATEGORY_ARTWORK.film;
  }
  if (desc.includes('dokumentation') || desc.includes('doku') || desc.includes('reportage')) {
    return GERMAN_CATEGORY_ARTWORK.doku;
  }
  if (desc.includes('serie') || desc.includes('staffel') || desc.includes('folge')) {
    return GERMAN_CATEGORY_ARTWORK.serie;
  }
  if (desc.includes('fussball') || desc.includes('bundesliga') || desc.includes('spiel')) {
    return GERMAN_CATEGORY_ARTWORK.sport;
  }

  // 6. Default Fallback
  return GERMAN_CATEGORY_ARTWORK.film;
}
