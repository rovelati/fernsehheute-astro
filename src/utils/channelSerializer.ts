import { formatTime } from './timeSlots';
import { getChannelLogo } from './channelLogos';
import type { Channel, Program } from '../types';

export interface SerializedChannelCard {
  slug: string;
  name: string;
  displayName: string;
  number: number;
  logo: string;
  start: string;
  end: string;
  title: string;
  cat: string;
  catGroup: string;
  nextStart: string;
  nextTitle: string;
  poster: string;
  desc: string;
  progId: string;
  isoStart: string;
  isoEnd: string;
}

export function serializeChannelForClient(
  channel: Channel & { slug: string; programs: Program[] },
  mode: 'abend' | 'morgen' = 'abend'
): SerializedChannelCard {
  const resolvedLogo = getChannelLogo(channel.id, channel.logo, channel.name);
  const toUTCMin = (t: string) => {
    const d = new Date(t);
    return d.getUTCHours() * 60 + d.getUTCMinutes();
  };
  const PRIME_START   = 18 * 60 + 15;
  const PRIME_END     = 21 * 60;
  const EVENING_START = 15 * 60;
  const MORNING_START =  4 * 60;

  const primeProgram   = channel.programs.find(p => {
    const m = toUTCMin(p.start_time);
    return m >= PRIME_START && m < PRIME_END;
  }) ?? null;
  const eveningProgram = channel.programs.find(p => toUTCMin(p.start_time) >= EVENING_START) ?? null;
  const morningFirst   = channel.programs.find(p => toUTCMin(p.start_time) >= MORNING_START) ?? null;

  const displayProgram: Program | null = mode === 'morgen'
    ? (primeProgram ?? morningFirst ?? channel.programs[0] ?? null)
    : (primeProgram ?? eveningProgram ?? channel.programs[0] ?? null);

  const nextProgram = displayProgram
    ? channel.programs.find(p => new Date(p.start_time) > new Date(displayProgram!.end_time)) ?? null
    : null;

  const rawCat = (displayProgram?.category || '').toLowerCase();
  let catGroup = 'sonstiges';
  if (rawCat.includes('film') || rawCat.includes('kino') || rawCat.includes('thriller') || rawCat.includes('komödie') || rawCat.includes('drama') || rawCat.includes('western')) {
    catGroup = 'film';
  } else if (rawCat.includes('serie') || rawCat.includes('sitcom') || rawCat.includes('soap')) {
    catGroup = 'serie';
  } else if (rawCat.includes('sport') || rawCat.includes('fussball') || rawCat.includes('fußball') || rawCat.includes('formel')) {
    catGroup = 'sport';
  } else if (rawCat.includes('doku') || rawCat.includes('wissen') || rawCat.includes('natur') || rawCat.includes('report')) {
    catGroup = 'doku';
  } else if (rawCat.includes('nachrichten') || rawCat.includes('news') || rawCat.includes('magazin') || rawCat.includes('journal')) {
    catGroup = 'news';
  } else if (rawCat.includes('show') || rawCat.includes('unterhaltung') || rawCat.includes('quiz') || rawCat.includes('comedy')) {
    catGroup = 'show';
  }

  return {
    slug: channel.slug,
    name: channel.name,
    displayName: channel.name.replace(/^DE\s*-\s*/i, ''),
    number: channel.number || 0,
    logo: resolvedLogo,
    start: displayProgram ? formatTime(displayProgram.start_time) : '',
    end: displayProgram ? formatTime(displayProgram.end_time) : '',
    title: displayProgram?.title ?? '',
    cat: displayProgram?.category ?? '',
    catGroup,
    nextStart: nextProgram ? formatTime(nextProgram.start_time) : '',
    nextTitle: nextProgram?.title ?? '',
    poster: displayProgram?.poster_url ?? '',
    desc: displayProgram?.description ? displayProgram.description.slice(0, 240) : '',
    progId: displayProgram?.id ?? '',
    isoStart: displayProgram?.start_time ?? '',
    isoEnd: displayProgram?.end_time ?? '',
  };
}
