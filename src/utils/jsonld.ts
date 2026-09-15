/**
 * JSON-LD schema generators — FernsehHeute
 *
 * Basato su:
 * - Google Search API leak (maggio 2024): freshness signal via dateModified,
 *   entity disambiguation con @id, BroadcastEvent per rich results TV
 * - Google Rich Results spec: BroadcastEvent, Movie, TVSeries, TVEpisode
 * - schema.org best practice 2025 per TV guide
 *
 * Regole:
 * - Ogni entità principale ha @id assoluto per l'entity graph
 * - WebPage con dateModified = ora del build (freshness signal per daily content)
 * - BroadcastEvent completo → rich snippet nella SERP Entertainment/TV
 * - Movie con WatchAction → eligible per Video rich results
 */
import type { Channel, Program } from '../types';

const SITE_URL   = 'https://fernsehheute.de';
const SITE_NAME  = 'FernsehHeute';
const ORG_ID     = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const GERMANY_ID = 'https://www.wikidata.org/wiki/Q183';

// ---------------------------------------------------------------------------
// Wikidata entity disambiguation per i canali principali tedeschi
// ---------------------------------------------------------------------------
const CHANNEL_WIKIDATA: Record<string, string> = {
  'das-erste':    'https://www.wikidata.org/wiki/Q7465',
  'zdf':          'https://www.wikidata.org/wiki/Q62562',
  'rtl':          'https://www.wikidata.org/wiki/Q170447',
  'sat1':         'https://www.wikidata.org/wiki/Q315801',
  'prosieben':    'https://www.wikidata.org/wiki/Q315798',
  'vox':          'https://www.wikidata.org/wiki/Q316181',
  'rtl2':         'https://www.wikidata.org/wiki/Q316182',
  'kabel-eins':   'https://www.wikidata.org/wiki/Q316183',
  'sixx':         'https://www.wikidata.org/wiki/Q1760452',
  'super-rtl':    'https://www.wikidata.org/wiki/Q690648',
  'nitro':        'https://www.wikidata.org/wiki/Q1781566',
  'tele5':        'https://www.wikidata.org/wiki/Q1436696',
  'zdf-neo':      'https://www.wikidata.org/wiki/Q873459',
  'zdfinfo':      'https://www.wikidata.org/wiki/Q1266338',
  '3sat':         'https://www.wikidata.org/wiki/Q168728',
  'arte':         'https://www.wikidata.org/wiki/Q51654',
  'phoenix':      'https://www.wikidata.org/wiki/Q510184',
  'one':          'https://www.wikidata.org/wiki/Q662851',
  'sport1':       'https://www.wikidata.org/wiki/Q694171',
  'dmax':         'https://www.wikidata.org/wiki/Q1207878',
  'welt':         'https://www.wikidata.org/wiki/Q1292628',
  'n-tv':         'https://www.wikidata.org/wiki/Q316175',
  'tagesschau24': 'https://www.wikidata.org/wiki/Q1742378',
  'kika':         'https://www.wikidata.org/wiki/Q696538',
};

// URL streaming ufficiali — usati in WatchAction
const CHANNEL_STREAM_URL: Record<string, string> = {
  'das-erste':  'https://www.ardmediathek.de/live/das-erste',
  'zdf':        'https://www.zdf.de/live-tv',
  'rtl':        'https://plus.rtl.de/live-tv/rtl',
  'sat1':       'https://www.sat1.de/live',
  'prosieben':  'https://www.prosieben.de/live',
  'vox':        'https://plus.rtl.de/live-tv/vox',
  'rtl2':       'https://plus.rtl.de/live-tv/rtl2',
  'kabel-eins': 'https://www.kabeleins.de/live',
  'sixx':       'https://www.sixx.de/live',
  'super-rtl':  'https://plus.rtl.de/live-tv/superrtl',
  'nitro':      'https://plus.rtl.de/live-tv/nitro',
  '3sat':       'https://www.3sat.de/live',
  'arte':       'https://www.arte.tv/de/live',
  'phoenix':    'https://www.ardmediathek.de/live/phoenix',
  'one':        'https://www.ardmediathek.de/live/one',
  'tagesschau24': 'https://www.ardmediathek.de/live/tagesschau24',
  'sport1':     'https://www.sport1.de/liveticker/livestream',
  'welt':       'https://www.welt.de/tv-programm/live-stream/',
  'n-tv':       'https://plus.rtl.de/live-tv/ntv',
};

// ---------------------------------------------------------------------------
// Helpers interni
// ---------------------------------------------------------------------------

/** ISO 8601 duration: PT1H30M */
function isoDuration(start: string, end: string): string {
  const ms = Math.max(0, new Date(end).getTime() - new Date(start).getTime());
  const totalMin = Math.round(ms / 60000);
  if (totalMin === 0) return 'PT0M';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0 && m > 0) return `PT${h}H${m}M`;
  if (h > 0) return `PT${h}H`;
  return `PT${m}M`;
}

/** Extrahiert Jahr aus Titeln wie "Filmname (2023)" */
function extractYear(title: string): string | null {
  const match = title.match(/\((\d{4})\)/);
  if (!match) return null;
  const y = parseInt(match[1], 10);
  return (y >= 1900 && y <= 2030) ? match[1] : null;
}

/** Bestimmt den schema.org-Typ des Inhalts */
function workType(program: Program): 'Movie' | 'TVEpisode' | 'Event' {
  const cat    = (program.category ?? '').toLowerCase();
  const title  = (program.title ?? '').toLowerCase();
  const hasYear = !!extractYear(program.title);

  if (cat.includes('film') || cat.includes('spielfilm') || cat.includes('kino') || cat.includes('movie') || hasYear) return 'Movie';
  if (cat.includes('sport') || title.includes('fußball') || title.includes('bundesliga') ||
      title.includes('formel 1') || title.includes('tennis') || title.includes('handball')) return 'Event';
  return 'TVEpisode';
}

/** Organization-Entität — in allen Schemas via @id referenziert */
function orgEntity(): Record<string, unknown> {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    knowsAbout: ['Television', 'Deutsches Fernsehen', 'TV Programm', 'Fernsehprogramm'],
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/favicon/apple-touch-icon.png`,
      width: 180,
      height: 180,
    },
  };
}

/** WebSite-Entität mit SearchAction (Sitelinks search box eligible) */
function websiteEntity(): Record<string, unknown> {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'de',
    publisher: { '@id': ORG_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * WebPage-Entität mit dateModified = Build-Zeitpunkt.
 * KRITISCH für Freshness: Google-Leak bestätigt dateModified als starkes Signal.
 */
function webPageEntity(url: string, name: string, description: string): Record<string, unknown> {
  return {
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: 'de',
    dateModified: new Date().toISOString(),
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORG_ID },
    breadcrumb: { '@id': `${url}#breadcrumb` },
  };
}

/** BroadcastService-Entität mit Wikidata sameAs */
function broadcastServiceEntity(channel: Channel, siteUrl = SITE_URL): Record<string, unknown> {
  const channelUrl = `${siteUrl}/${channel.id}/`;
  const wikidata   = CHANNEL_WIKIDATA[channel.id];

  return {
    '@type': 'BroadcastService',
    '@id': `${channelUrl}#channel`,
    name: channel.name,
    broadcastDisplayName: channel.name,
    ...(channel.number ? { broadcastChannelId: String(channel.number) } : {}),
    broadcastTimezone: 'Europe/Berlin',
    inLanguage: 'de',
    areaServed: {
      '@type': 'Country',
      name: 'Germany',
      sameAs: GERMANY_ID,
    },
    ...(wikidata ? { sameAs: wikidata } : {}),
    broadcastAffiliateOf: {
      '@type': 'Organization',
      name: channel.name,
      url: channelUrl,
    },
  };
}

/**
 * BroadcastEvent — generiert Rich Result in der SERP Entertainment.
 * Pflichtfelder: name, startDate, endDate, publishedOn.
 */
function broadcastEventEntity(
  program: Program,
  channel: Channel,
  eventId: string,
  siteUrl = SITE_URL,
): Record<string, unknown> {
  const type       = workType(program);
  const year       = extractYear(program.title);
  const streamUrl  = CHANNEL_STREAM_URL[channel.id];
  const channelUrl = `${siteUrl}/${channel.id}/`;

  const liveUrl = streamUrl ?? channelUrl;

  const workPerformed: Record<string, unknown> = {
    '@type': type === 'Event' ? 'SportsEvent' : type,
    '@id': `${eventId}#work`,
    name: program.title,
    inLanguage: 'de',
    ...(program.description ? { description: program.description }  : {}),
    ...(program.category    ? { genre: program.category }           : {}),
    ...(program.poster_url  ? { image: program.poster_url }         : {}),
    ...(year                ? { dateCreated: year }                 : {}),
    url: channelUrl,
  };

  if (type === 'Event') {
    workPerformed['startDate'] = program.start_time;
    workPerformed['endDate']   = program.end_time;
    workPerformed['location']  = { '@type': 'VirtualLocation', url: liveUrl };
  }

  if (type === 'TVEpisode') {
    workPerformed['partOfSeries'] = {
      '@type': 'TVSeries',
      name: program.title,
      url: channelUrl,
    };
  }

  if (streamUrl) {
    workPerformed['potentialAction'] = {
      '@type': 'WatchAction',
      target: streamUrl,
    };
  }

  return {
    '@type': 'BroadcastEvent',
    '@id': `${eventId}#event`,
    name: program.title,
    ...(program.description ? { description: program.description } : {}),
    startDate: program.start_time,
    endDate:   program.end_time,
    duration:  isoDuration(program.start_time, program.end_time),
    isLiveBroadcast: false,
    videoFormat: 'HD',
    eventStatus: 'https://schema.org/EventScheduled',
    inLanguage: 'de',
    url: channelUrl,
    ...(program.poster_url ? { image: program.poster_url } : {}),
    location: {
      '@type': 'VirtualLocation',
      url: liveUrl,
    },
    publishedOn: { '@id': `${channelUrl}#channel` },
    workPerformed,
  };
}

// ===========================================================================
// Öffentliche Funktionen für jeden Seitentyp
// ===========================================================================

// ---------------------------------------------------------------------------
// Hub Sender (/[sender])
// ---------------------------------------------------------------------------
export function buildHubChannelJsonLd({
  channel,
  programs,
  today,
  siteUrl = SITE_URL,
}: {
  channel: Channel;
  programs: Program[];
  today: string;
  siteUrl?: string;
}): object[] {
  const channelUrl = `${siteUrl}/${channel.id}/`;
  const pageTitle  = `${channel.name} Programm heute – Sendungen & Sendezeiten`;
  const pageDesc   = `Vollständiges ${channel.name} Programm heute: alle Sendungen, Filme und Serien mit genauen Sendezeiten. Kompletter Tages- und Abendplan.`;

  // Nur Prime Time in strukturierten Daten (18-21 UTC = 20-23 Berlin CEST)
  const primeTime = programs.filter(p => {
    const h = new Date(p.start_time).getUTCHours();
    return h >= 18 && h <= 21;
  });

  const broadcastService = broadcastServiceEntity(channel, siteUrl);

  const broadcastEvents = primeTime.slice(0, 10).map(p =>
    broadcastEventEntity(
      p, channel,
      `${channelUrl}#prog-${p.id ?? p.slug}`,
      siteUrl,
    ),
  );

  const tvChannel: object = {
    '@context': 'https://schema.org',
    '@type': 'TVChannel',
    '@id': `${channelUrl}#tvchannel`,
    name: channel.name,
    ...(channel.number ? { broadcastChannelId: String(channel.number) } : {}),
    url: channelUrl,
    inBroadcastLineup: { '@id': `${channelUrl}#channel` },
    broadcastOfEvent: broadcastEvents,
  };

  const itemList: object = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${channelUrl}#list`,
    name: pageTitle,
    url: channelUrl,
    numberOfItems: primeTime.length,
    itemListElement: primeTime.slice(0, 20).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.title,
      url: channelUrl,
      ...(p.description ? { description: p.description.slice(0, 160) } : {}),
    })),
  };

  const breadcrumb: object = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${channelUrl}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'TV Programm heute', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: channel.name,        item: channelUrl },
    ],
  };

  const webPage: object = {
    '@context': 'https://schema.org',
    ...webPageEntity(channelUrl, pageTitle, pageDesc),
  };

  return [
    { '@context': 'https://schema.org', ...orgEntity() },
    { '@context': 'https://schema.org', ...broadcastService },
    tvChannel,
    itemList,
    breadcrumb,
    webPage,
  ];
}

// ---------------------------------------------------------------------------
// Hub Home (/)
// ---------------------------------------------------------------------------
export function buildHubHomeJsonLd({
  channels,
  today,
  siteUrl = SITE_URL,
}: {
  channels: Channel[];
  today: string;
  siteUrl?: string;
}): object[] {
  return [
    { '@context': 'https://schema.org', ...websiteEntity() },
    { '@context': 'https://schema.org', ...orgEntity() },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${siteUrl}/#list`,
      name: 'TV Programm heute – Alle Sender & Sendezeiten',
      url: `${siteUrl}/`,
      numberOfItems: channels.length,
      itemListElement: channels.slice(0, 15).map((ch, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `${ch.name} heute Abend — TV Programm`,
        url: `${siteUrl}/${ch.id}/`,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      '@id': `${siteUrl}/#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'TV Programm heute', item: `${siteUrl}/` },
      ],
    },
    {
      '@context': 'https://schema.org',
      ...webPageEntity(
        `${siteUrl}/`,
        'TV Programm heute – Alle Sender & Sendezeiten',
        'Deutsches TV Programm heute: alle Sendungen auf ARD, ZDF, RTL, SAT.1, ProSieben und weiteren deutschen Sendern mit genauen Sendezeiten.',
      ),
    },
  ];
}

// ---------------------------------------------------------------------------
// Hub Kategorie (/film-heute-abend, /serien-heute-abend, /sport-heute-abend)
// ---------------------------------------------------------------------------
export function buildHubCategoryJsonLd({
  categoryName,
  categorySlug,
  programs,
  today,
  siteUrl = SITE_URL,
}: {
  categoryName: string;
  categorySlug: string;
  programs: Program[];
  today: string;
  siteUrl?: string;
}): object[] {
  const pageUrl    = `${siteUrl}/${categorySlug}/`;
  const isFilmPage = categorySlug === 'film-heute-abend';

  const itemListElements = programs.slice(0, 20).map((p, i) => {
    if (isFilmPage) {
      const year = extractYear(p.title);
      return {
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Movie',
          name: p.title,
          ...(p.description ? { description: p.description.slice(0, 160) } : {}),
          ...(p.poster_url  ? { image: p.poster_url }  : {}),
          ...(year          ? { dateCreated: year }     : {}),
          inLanguage: 'de',
        },
      };
    }
    return {
      '@type': 'ListItem',
      position: i + 1,
      name: p.title,
      ...(p.description ? { description: p.description.slice(0, 160) } : {}),
    };
  });

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${pageUrl}#list`,
      name: `${categoryName} heute Abend im TV`,
      url: pageUrl,
      numberOfItems: programs.length,
      itemListElement: itemListElements,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'TV Programm heute',          item: `${siteUrl}/` },
        { '@type': 'ListItem', position: 2, name: `${categoryName} heute Abend`, item: pageUrl },
      ],
    },
    {
      '@context': 'https://schema.org',
      ...webPageEntity(
        pageUrl,
        `${categoryName} heute Abend im TV`,
        `Alle ${categoryName.toLowerCase()} heute Abend im deutschen Fernsehen mit genauen Sendezeiten auf allen Sendern.`,
      ),
    },
  ];
}
