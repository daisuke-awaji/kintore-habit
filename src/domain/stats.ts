import { diffDays, maxKey, weekDays, weekStart, addDays, type DateKey } from './date';
import { STRENGTH_AREAS, type AppData, type Session, type StrengthArea } from './schema';

const byDateThenAt = (a: Session, b: Session) =>
  a.date === b.date ? a.at.localeCompare(b.at) : a.date.localeCompare(b.date);

export function sessionsOn(data: AppData, date: DateKey): Session[] {
  return data.sessions.filter((s) => s.date === date).sort(byDateThenAt);
}

export function hasSessionOn(data: AppData, date: DateKey): boolean {
  return data.sessions.some((s) => s.date === date);
}

/** 回復日（その日に記録があれば、記録のほうを優先する） */
export function isRestDay(data: AppData, date: DateKey): boolean {
  return data.restDays.includes(date) && !hasSessionOn(data, date);
}

/** やった日の集合。回数は「やった日」の数で数える（1日に何回やっても1回） */
export function activeDays(data: AppData): Set<DateKey> {
  return new Set(data.sessions.map((s) => s.date));
}

export function weekCount(data: AppData, weekStartKey: DateKey): number {
  const days = new Set(weekDays(weekStartKey));
  return new Set(data.sessions.filter((s) => days.has(s.date)).map((s) => s.date)).size;
}

/** その週の目標。目標を変えても過去の週の達成が消えないよう、週ごとの目標を優先する */
export function goalForWeek(data: AppData, weekStartKey: DateKey): number {
  return data.weekGoals[weekStartKey] ?? data.settings.weeklyGoal;
}

export function isWeekAchieved(data: AppData, weekStartKey: DateKey): boolean {
  return weekCount(data, weekStartKey) >= goalForWeek(data, weekStartKey);
}

export function achievedWeekCount(data: AppData): number {
  const weeks = new Set(data.sessions.map((s) => weekStart(s.date)));
  let n = 0;
  for (const ws of weeks) if (isWeekAchieved(data, ws)) n++;
  return n;
}

export function totalDays(data: AppData): number {
  return activeDays(data).size;
}

export function totalMinutes(data: AppData): number {
  const sec = data.sessions.reduce((sum, s) => sum + s.durationSec, 0);
  return Math.round(sec / 60);
}

export function minutesOn(data: AppData, date: DateKey): number {
  const sec = sessionsOn(data, date).reduce((sum, s) => sum + s.durationSec, 0);
  return Math.round(sec / 60);
}

/** 始めてから何日目か（始めた日を1日目とする） */
export function dayNumberSinceStart(data: AppData, today: DateKey): number {
  if (!data.startDate) return 0;
  return Math.max(1, diffDays(today, data.startDate) + 1);
}

/** 今日より前で、最後に記録か回復日を付けた日 */
export function lastEngagedBefore(data: AppData, today: DateKey): DateKey | null {
  const keys = [...data.sessions.map((s) => s.date), ...data.restDays].filter((k) => k < today);
  return maxKey(keys);
}

/**
 * 「おかえり」と言うまでの間隔。週の目標が少ない人ほど、ふだんの間隔が長いので長めにする。
 * 週1回 → 10日、週2回 → 7日、週3〜4回 → 5日
 */
export function welcomeBackGapDays(weeklyGoal: number): number {
  if (weeklyGoal <= 1) return 10;
  if (weeklyGoal === 2) return 7;
  return 5;
}

export function isWelcomeBack(data: AppData, today: DateKey): boolean {
  if (data.sessions.length === 0) return false;
  if (hasSessionOn(data, today) || data.restDays.includes(today)) return false;
  const last = lastEngagedBefore(data, today);
  if (!last) return false;
  return diffDays(today, last) >= welcomeBackGapDays(data.settings.weeklyGoal);
}

export function lastStrengthSession(data: AppData): Session | undefined {
  return data.sessions
    .filter((s) => s.kind === 'workout' && s.area !== undefined && s.area !== 'recovery')
    .sort(byDateThenAt)
    .at(-1);
}

/** 次に鍛える部位：下半身 → 上半身 → 体幹 の順番 */
export function nextArea(data: AppData): StrengthArea {
  const last = lastStrengthSession(data);
  if (!last || !last.area || last.area === 'recovery') return 'lower';
  const i = STRENGTH_AREAS.indexOf(last.area);
  return STRENGTH_AREAS[(i + 1) % STRENGTH_AREAS.length];
}

/** あとから記録を直せる日数 */
export const BACKFILL_DAYS = 7;

export function canEditDay(data: AppData, date: DateKey, today: DateKey): boolean {
  if (!data.startDate) return false;
  if (date > today || date < data.startDate) return false;
  return diffDays(today, date) <= BACKFILL_DAYS;
}

/** 今週から、始めた週までの週（新しい順） */
export function weeksSinceStart(data: AppData, today: DateKey): DateKey[] {
  const current = weekStart(today);
  const first = weekStart(data.startDate ?? today);
  const weeks: DateKey[] = [];
  for (let ws = current; ws >= first; ws = addDays(ws, -7)) weeks.push(ws);
  return weeks;
}

/** 部位ごとに、最初に記録したレベル */
export function firstLevels(data: AppData): Partial<Record<StrengthArea, number>> {
  const result: Partial<Record<StrengthArea, number>> = {};
  for (const s of [...data.sessions].sort(byDateThenAt)) {
    if (s.kind !== 'workout' || !s.area || s.area === 'recovery' || !s.level) continue;
    if (result[s.area] === undefined) result[s.area] = s.level;
  }
  return result;
}
