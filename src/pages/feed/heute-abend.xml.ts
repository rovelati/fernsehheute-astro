import type { APIRoute } from 'astro';
import { fetchChannels, fetchProgramsForDate } from '../../lib/epg';
import { getTodayInBerlin, formatDateDE, formatTime, getBerlinHour } from '../../utils/timeSlots';
import { getChannelLogo } from '../../utils/channelLogos';
import { normCid } from '../../utils/channelSlug';
import type { Channel, Program } from '../../types';

const SITE_URL = 'https://fernsehheute.de';

const MAIN_CHANNELS = [
  'das-erste', 'zdf', 'rtl', 'sat1', 'prosieben', 'vox', 'rtl2', 'kabel-eins',
  'sixx', 'super-rtl', 'nitro', 'tele5', 'zdf-neo', 'zdfinfo', '3sat', 'arte',
  'phoenix', 'one', 'sport1', 'dmax', 'n-tv', 'welt', 'tagesschau24', 'kika',
];

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async () => {
  const today = getTodayInBerlin();
  const dateLabel = formatDateDE(today);

  let channels: Channel[] = [];
  let allPrograms: Program[] = [];

  try {
    [channels, allPrograms] = await Promise.all([
      fetchChannels(),
      fetchProgramsForDate(today),
    ]);
  } catch (err) {
    console.error('[feed/heute-abend.xml] error fetching data:', err);
  }

  const channelMap = new Map<string, Channel>();
  for (const ch of channels) {
    const slug = normCid(ch.id);
    channelMap.set(slug, ch);
  }

  // Filter programs for evening (>= 18:00 CEST) from main channels
  const primePrograms: Array<{ program: Program; channel: Channel }> = [];

  for (const prog of allPrograms) {
    const slug = normCid(prog.channel_id ?? '');
    if (!MAIN_CHANNELS.includes(slug)) continue;

    const startH = getBerlinHour(prog.start_time);
    if (startH >= 18 && startH <= 23) {
      const ch = channelMap.get(slug);
      if (ch) {
        primePrograms.push({ program: prog, channel: ch });
      }
    }
  }

  // Sort by channel priority and start time
  primePrograms.sort((a, b) => {
    const aNorm = normCid(a.channel.id);
    const bNorm = normCid(b.channel.id);
    const aIdx = MAIN_CHANNELS.indexOf(aNorm);
    const bIdx = MAIN_CHANNELS.indexOf(bNorm);
    if (aIdx !== bIdx) return aIdx - bIdx;
    return new Date(a.program.start_time).getTime() - new Date(b.program.start_time).getTime();
  });

  const nowRfc = new Date().toUTCString();

  const itemsXml = primePrograms.slice(0, 50).map(({ program, channel }) => {
    const slug = normCid(channel.id);
    const channelName = channel.name.replace(/^DE\s*-\s*/i, '');
    const startTimeStr = formatTime(program.start_time);
    const endTimeStr = formatTime(program.end_time);
    const channelUrl = `${SITE_URL}/${slug}/`;
    const programTitle = program.title || 'Sendung';
    const itemTitle = `${startTimeStr} Uhr auf ${channelName}: ${programTitle}`;
    const pubDate = new Date(program.start_time).toUTCString();
    const guid = `https://fernsehheute.de/${slug}/#prog-${program.id || program.title.replace(/\s+/g, '-')}-${today}`;
    
    const logoUrl = getChannelLogo(channel.id, channel.logo, channel.name);
    const resolvedImage = program.poster_url || (logoUrl.startsWith('http') ? logoUrl : `${SITE_URL}${logoUrl}`);

    const desc = program.description
      ? escapeXml(program.description)
      : `${programTitle} heute Abend von ${startTimeStr} bis ${endTimeStr} Uhr auf ${channelName}.`;

    return `
    <item>
      <title>${escapeXml(itemTitle)}</title>
      <link>${channelUrl}</link>
      <guid isPermaLink="false">${guid}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[<p><strong>${escapeXml(channelName)} (${startTimeStr} – ${endTimeStr} Uhr):</strong> ${desc}</p>]]></description>
      <category>${escapeXml(program.category || 'TV-Programm')}</category>
      <dc:creator>FernsehHeute</dc:creator>
      <media:content url="${escapeXml(resolvedImage)}" medium="image" />
      <enclosure url="${escapeXml(resolvedImage)}" length="0" type="image/jpeg" />
    </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:wfw="http://wellformedweb.org/CommentAPI/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"
  xmlns:slash="http://purl.org/rss/1.0/modules/slash/"
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>FernsehHeute — TV Programm heute Abend Highlights</title>
    <atom:link href="${SITE_URL}/feed/heute-abend.xml" rel="self" type="application/rss+xml" />
    <link>${SITE_URL}</link>
    <description>Aktuelle TV-Highlights und das Hauptabendprogramm für heute Abend ab 20:15 Uhr in Deutschland.</description>
    <lastBuildDate>${nowRfc}</lastBuildDate>
    <language>de-DE</language>
    <sy:updatePeriod>hourly</sy:updatePeriod>
    <sy:updateFrequency>1</sy:updateFrequency>
    <image>
      <url>${SITE_URL}/favicon.svg</url>
      <title>FernsehHeute</title>
      <link>${SITE_URL}</link>
      <width>144</width>
      <height>144</height>
    </image>
    ${itemsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, s-maxage=3600',
    },
  });
};
