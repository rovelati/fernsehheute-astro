/** Get current date in Europe/Berlin timezone as YYYY-MM-DD string */
export const getTodayInBerlin = (): string => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')!.value;
  const month = parts.find(p => p.type === 'month')!.value;
  const day = parts.find(p => p.type === 'day')!.value;
  return `${year}-${month}-${day}`;
};

/** Get tomorrow's date in Europe/Berlin timezone as YYYY-MM-DD string */
export const getTomorrowInBerlin = (): string => {
  const today = getTodayInBerlin();
  const [year, month, day] = today.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCDate(utcDate.getUTCDate() + 1);
  return utcDate.toISOString().slice(0, 10);
};

/** Get yesterday's date in Europe/Berlin timezone as YYYY-MM-DD string */
export const getYesterdayInBerlin = (): string => {
  const today = getTodayInBerlin();
  const [year, month, day] = today.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCDate(utcDate.getUTCDate() - 1);
  return utcDate.toISOString().slice(0, 10);
};

/** Format a date string as German long date (z.B. "Dienstag, 15. April 2026") */
export const formatDateDE = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString('de-DE', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/** Format ISO timestamp to HH:MM (Berlin time display) */
export const formatTime = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('de-DE', {
    timeZone: 'Europe/Berlin',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

/** Returns true if a program is currently live */
export const isProgramLive = (startTime: string, endTime: string): boolean => {
  const now = Date.now();
  return new Date(startTime).getTime() <= now && now < new Date(endTime).getTime();
};

/** Returns the hour (Berlin time) of an ISO timestamp */
export const getBerlinHour = (isoString: string): number => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Berlin',
    hour: '2-digit',
    hour12: false,
  });
  return parseInt(formatter.format(new Date(isoString)));
};

/** Returns the minutes from midnight (Berlin time) of an ISO timestamp */
export const getBerlinMinutes = (isoString: string): number => {
  const d = new Date(isoString);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Berlin',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(d);
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10);
  return hour * 60 + minute;
};

/** Returns true if the program is in prime time (20:00–23:00 Berlin) */
export const isPrimeTime = (startTime: string): boolean => {
  const h = getBerlinHour(startTime);
  return h >= 20 && h <= 22;
};

/**
 * Trova il vero programma di Prime Time (20:15) per un canale.
 * Regole rigorose per la TV tedesca:
 * 1. Il programma DEVE essere in onda alle 20:15 (start <= 20:15 AND end > 20:15).
 *    NON deve finire alle o prima delle 20:15 (es. Wetter 19:20-19:25 o GZSZ 19:40-20:15 NON sono il programma 20:15!).
 *    Se ce ne sono più di uno (es. show iniziato alle 19:30 o 20:00), preferisce quello iniziato più vicino alle 20:15.
 * 2. Un programma che inizia attorno alle 20:15 (finestra 20:00 - 20:45), il più vicino possibile alle 20:15.
 * 3. Fallback: primo programma che inizia dopo le 20:15 nella prima serata (tra 20:15 e 22:00).
 */
export function getPrimeTimeProgram(programs: { start_time: string; end_time: string; [key: string]: any }[]): any {
  if (!programs || programs.length === 0) return null;
  const TARGET_MIN = 20 * 60 + 15; // 1215 min = 20:15 Berlin

  // 1. Program on air AT 20:15 (must start <= 20:15 AND end > 20:15)
  // Strict condition: end > TARGET_MIN (program must NOT have already ended!)
  const covering = programs.filter(p => {
    const s = getBerlinMinutes(p.start_time);
    let e = getBerlinMinutes(p.end_time);
    if (e < s) e += 1440; // crosses midnight
    // Avoid daytime shows that started before 18:00 unless nothing else exists
    return s <= TARGET_MIN && e > TARGET_MIN && s >= 18 * 60;
  });

  if (covering.length > 0) {
    // Pick the one starting closest to 20:15 (highest start timestamp)
    covering.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
    return covering[0];
  }

  // 2. Program starting around 20:15 (window 20:00 - 20:45) closest to 20:15
  const window2015 = programs.filter(p => {
    const s = getBerlinMinutes(p.start_time);
    return s >= 20 * 60 && s <= 20 * 60 + 45;
  });
  if (window2015.length > 0) {
    window2015.sort((a, b) => {
      const diffA = Math.abs(getBerlinMinutes(a.start_time) - TARGET_MIN);
      const diffB = Math.abs(getBerlinMinutes(b.start_time) - TARGET_MIN);
      return diffA - diffB;
    });
    return window2015[0];
  }

  // 3. Fallback: any show covering 20:15 even if started before 18:00 (e.g. sports marathon)
  const anyCovering = programs.filter(p => {
    const s = getBerlinMinutes(p.start_time);
    let e = getBerlinMinutes(p.end_time);
    if (e < s) e += 1440;
    return s <= TARGET_MIN && e > TARGET_MIN;
  });
  if (anyCovering.length > 0) {
    anyCovering.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
    return anyCovering[0];
  }

  // 4. Closest evening show starting after 20:15 (20:15 - 22:00)
  const after2015 = programs.filter(p => {
    const s = getBerlinMinutes(p.start_time);
    return s > TARGET_MIN && s <= 22 * 60;
  });
  if (after2015.length > 0) {
    after2015.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    return after2015[0];
  }

  return null;
}

/**
 * Trova il programma serale per la Homepage "Heute Abend" (fascia serale dalle 18:00 in poi).
 */
export function getEveningProgram(programs: { start_time: string; end_time: string; [key: string]: any }[]): any {
  if (!programs || programs.length === 0) return null;
  const eveningProgs = programs.filter(p => {
    const s = getBerlinMinutes(p.start_time);
    return s >= 18 * 60 && s < 23 * 60;
  });
  if (eveningProgs.length > 0) {
    return eveningProgs[0];
  }
  return programs[0] ?? null;
}
