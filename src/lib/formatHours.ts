type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type HoursMap = Record<DayKey, { open: string; close: string } | null>;

const DAY_SHORT: Record<DayKey, string> = {
  mon: 'Po', tue: 'Ut', wed: 'St', thu: 'Št', fri: 'Pi', sat: 'So', sun: 'Ne',
};

/**
 * Returns compact display string, e.g.:
 * "Po–Pi 09:00–18:00 · So 09:00–14:00"
 */
export function formatHoursDisplay(hours: unknown): string | null {
  if (!hours || typeof hours !== 'object') return null;
  const map = hours as HoursMap;

  const weekdays: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri'];
  const weekend:  DayKey[] = ['sat', 'sun'];

  const parts: string[] = [];

  // Group weekdays if all same hours
  const wdHours = weekdays.map(d => map[d]);
  const firstWd = wdHours[0];
  if (firstWd && wdHours.every(h => h?.open === firstWd.open && h?.close === firstWd.close)) {
    parts.push(`Po–Pi ${firstWd.open}–${firstWd.close}`);
  } else {
    weekdays.forEach(d => {
      const h = map[d];
      if (h) parts.push(`${DAY_SHORT[d]} ${h.open}–${h.close}`);
    });
  }

  // Weekend — show open days
  weekend.forEach(d => {
    const h = map[d];
    if (h) parts.push(`${DAY_SHORT[d]} ${h.open}–${h.close}`);
  });

  return parts.length > 0 ? parts.join(' · ') : null;
}
