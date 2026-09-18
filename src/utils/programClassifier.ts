/**
 * Program Classifier
 * Classifies German TV programs into Movies (Spielfilme), Series (Serien), and Sports (Sport).
 */
import type { Program } from '../types';

const NON_FILM_CATEGORIES = new Set([
  'nachrichten', 'magazin', 'dokumentation', 'talkshow', 'musik', 'politik', 'ratgeber', 'kochen',
  'natur und tiere', 'kultur', 'reality', 'sport', 'show', 'reportage', 'gesellschaft', 'lifestyle',
  'auto', 'kinder', 'werbesendung', 'umweltmagazin', 'servicemagazin', 'regionalmagazin', 'quiz',
  'quizshow', 'gesundheitsmagazin', 'kabarett', 'comedyshow', 'religionsbericht', 'talk', 'politikmagazin',
  'reportagereihe', 'kabarettshow', 'volksfest', 'heimatreportage', 'sportmagazin', 'wissensmagazin',
  'spielshow', 'kochshow', 'freizeitmagazin', 'fußball', 'basketball', 'tennis', 'motorsport', 'doku'
]);

const SERIE_CATEGORIES = new Set([
  'serie', 'serien', 'sitcom', 'soap', 'daily soap', 'telenovela', 'krimiserie', 'dramaserie',
  'animationsserie', 'zeichentrickserie', 'dokuserie', 'dokusoap', 'abenteuerserie', 'historienserie',
  'krankenhausserie', 'comedy-serie', 'actionserie', 'comedyserie', 'miniserie', 'jugendserie',
  'kinderserie', 'reality-soap'
]);

const FILM_CATEGORIES = new Set([
  'film', 'spielfilm', 'kinofilm', 'movie', 'tv-movie', 'fernsehfilm', 'kino', 'kurzfilm',
  'drama', 'komödie', 'comedy', 'thriller', 'action', 'horror', 'science-fiction', 'sci-fi',
  'fantasy', 'abenteuer', 'western', 'romantik', 'romantikkomödie', 'erotischer film',
  'erotikthriller', 'psychothriller', 'actionthriller', 'krimithriller', 'kriminalfilm',
  'gangsterfilm', 'abenteuerfilm', 'historienfilm', 'liebesfilm', 'heimatfilm', 'märchenfilm',
  'katastrophenfilm', 'mysterythriller', 'actionkomödie', 'tragikomödie', 'animationsfilm',
  'krimi', 'zeichentrick'
]);

const SERIE_REGEX = /\b(staffel\s*\d+|folge\s*\d+|episode\s*\d+|s\d+\s*e\d+|e\d{2,}\b)/i;
const MOVIE_DESC_REGEX = /\b(spielfilm|kinofilm|fernsehfilm|tv-drama|regie:|filmkomödie|hollywood-blockbuster|filmdrama|western)\b/i;

export function isExplicitSerie(prog: Program): boolean {
  const cat = (prog.category ?? '').toLowerCase().trim();
  const desc = prog.description ?? '';
  const title = prog.title ?? '';
  if (SERIE_CATEGORIES.has(cat)) return true;
  if (SERIE_REGEX.test(title) || SERIE_REGEX.test(desc)) return true;
  return false;
}

export function isFilm(prog: Program): boolean {
  const cat = (prog.category ?? '').toLowerCase().trim();
  const desc = prog.description ?? '';

  if (NON_FILM_CATEGORIES.has(cat)) return false;
  if (isExplicitSerie(prog)) return false;

  const start = new Date(prog.start_time).getTime();
  const end = new Date(prog.end_time).getTime();
  const durationMin = (end - start) / 60000;

  if (FILM_CATEGORIES.has(cat)) {
    // For Krimi, Drama, Comedy, Zeichentrick: needs to be >= 60 min if no explicit film keyword
    if (['krimi', 'drama', 'comedy', 'zeichentrick'].includes(cat)) {
      return durationMin >= 60;
    }
    return durationMin >= 45;
  }

  if (MOVIE_DESC_REGEX.test(desc) && durationMin >= 60) {
    return true;
  }
  return false;
}

export function isSeries(prog: Program): boolean {
  const cat = (prog.category ?? '').toLowerCase().trim();
  if (NON_FILM_CATEGORIES.has(cat) && !SERIE_CATEGORIES.has(cat)) return false;
  if (isExplicitSerie(prog)) return true;
  if (SERIE_CATEGORIES.has(cat)) return true;
  return false;
}

const SPORT_EXACT_CAT = new Set([
  'sport', 'fußball', 'fussball', 'basketball', 'tennis', 'motorsport', 'golf', 'handball',
  'eishockey', 'boxen', 'kampfsport', 'darts', 'snooker', 'rugby', 'volleyball',
  'radsport', 'pferdesport', 'american football', 'softball', 'leichtathletik', 'wintersport'
]);

const SPORT_WORD_REGEX = /\b(bundesliga|champions league|europa league|conference league|premier league|la liga|serie a|dfb-pokal|formel 1|formula 1|wimbledon|roland garros|us open|australian open|tour de france|motogp|nfl|nba|nhl|world cup|olympia|sportschau|sportstudio)\b/i;

export function isSport(prog: Program): boolean {
  const cat = (prog.category ?? '').toLowerCase().trim();
  const title = prog.title ?? '';
  const desc = prog.description ?? '';
  if (SPORT_EXACT_CAT.has(cat)) return true;
  if (SPORT_WORD_REGEX.test(title) || SPORT_WORD_REGEX.test(desc)) return true;
  return false;
}

export const MAIN_GERMAN_CHANNELS = [
  'das-erste', 'daserste', 'zdf', 'rtl', 'sat1', 'prosieben', 'vox', 'rtl2', 'kabel-eins',
  'kabeleins', '3sat', 'arte', 'nitro', 'super-rtl', 'superrtl', 'tele5', 'zdf-neo', 'zdfneo',
  'one', 'sixx', 'sat1-gold', 'sat1gold', 'prosieben-maxx', 'prosiebenmaxx', 'dmax', 'warner-tv-film',
  'sport1', 'eurosport-1', 'phoenix', 'n-tv', 'ntv', 'welt', 'tagesschau24', 'kika'
];
