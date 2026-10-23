/** 'YYYY-MM-DD' 形式の日付（ローカル時刻の暦日） */
export type DateKey = string;

const pad = (n: number) => String(n).padStart(2, '0');
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS_JA = ['日', '月', '火', '水', '木', '金', '土'] as const;

export function toKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 計算の誤差を避けるため、ローカル時刻の正午として Date にする */
export function fromKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function isDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toKey(fromKey(value)) === value;
}

/**
 * 論理日付。1日の区切り（boundaryHour 時）より前の時刻は前日として扱う。
 * 例：区切りが4時なら、10/24 03:59 は 10/23。
 */
export function logicalDate(now: Date, boundaryHour: number): DateKey {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  if (now.getHours() < boundaryHour) d.setDate(d.getDate() - 1);
  return toKey(d);
}

export function addDays(key: DateKey, days: number): DateKey {
  const d = fromKey(key);
  d.setDate(d.getDate() + days);
  return toKey(d);
}

/** a − b の日数 */
export function diffDays(a: DateKey, b: DateKey): number {
  return Math.round((fromKey(a).getTime() - fromKey(b).getTime()) / DAY_MS);
}

/** その週の月曜日 */
export function weekStart(key: DateKey): DateKey {
  const dow = fromKey(key).getDay(); // 0=日
  const offset = (dow + 6) % 7; // 月曜からの日数
  return addDays(key, -offset);
}

/** 月曜から日曜までの7日 */
export function weekDays(weekStartKey: DateKey): DateKey[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStartKey, i));
}

export function weekdayJa(key: DateKey): string {
  return WEEKDAYS_JA[fromKey(key).getDay()];
}

/** 10月23日(金) */
export function formatDateJa(key: DateKey): string {
  const d = fromKey(key);
  return `${d.getMonth() + 1}月${d.getDate()}日(${weekdayJa(key)})`;
}

/** 10月23日 */
export function formatMonthDay(key: DateKey): string {
  const d = fromKey(key);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function dayOfMonth(key: DateKey): number {
  return fromKey(key).getDate();
}

/** 10月20日〜26日（月をまたぐときは 10月27日〜11月2日） */
export function formatWeekRange(weekStartKey: DateKey): string {
  const s = fromKey(weekStartKey);
  const e = fromKey(addDays(weekStartKey, 6));
  const left = `${s.getMonth() + 1}月${s.getDate()}日`;
  const right = s.getMonth() === e.getMonth() ? `${e.getDate()}日` : `${e.getMonth() + 1}月${e.getDate()}日`;
  return `${left}〜${right}`;
}

export function maxKey(keys: Iterable<DateKey>): DateKey | null {
  let best: DateKey | null = null;
  for (const k of keys) if (best === null || k > best) best = k;
  return best;
}
