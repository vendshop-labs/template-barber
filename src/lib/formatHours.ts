type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type HoursMap = Record<DayKey, { open: string; close: string } | null>;

const SHORT: Record<DayKey, string> = {
  mon: 'Po', tue: 'Ut', wed: 'St', thu: 'Št', fri: 'Pi', sat: 'So', sun: 'Ne',
};

const ORDER: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export function formatHoursDisplay(hours: unknown): string | null {
  if (!hours || typeof hours !== 'object') return null;
  const map = hours as HoursMap;

  // Build list of open days in week order
  const open = ORDER.filter(d => map[d] !== null && map[d] !== undefined);
  if (open.length === 0) return null;

  const parts: string[] = [];
  let i = 0;

  while (i < open.length) {
    const day   = open[i];
    const h     = map[day]!;
    const range = `${h.open}–${h.close}`;

    // Find how far this consecutive group extends (same hours)
    let j = i + 1;
    while (
      j < open.length &&
      ORDER.indexOf(open[j]) === ORDER.indexOf(open[j - 1]) + 1 &&
      map[open[j]]?.open  === h.open &&
      map[open[j]]?.close === h.close
    ) j++;

    const groupLen = j - i;
    if (groupLen === 1) {
      parts.push(`${SHORT[day]} ${range}`);
    } else if (groupLen === 2) {
      parts.push(`${SHORT[day]}, ${SHORT[open[j - 1]]} ${range}`);
    } else {
      parts.push(`${SHORT[day]}–${SHORT[open[j - 1]]} ${range}`);
    }

    i = j;
  }

  return parts.join(' · ') || null;
}
