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

/** Returns true if the program is in prime time (20:00–23:00 Berlin) */
export const isPrimeTime = (startTime: string): boolean => {
  const h = getBerlinHour(startTime);
  return h >= 20 && h <= 22;
};
