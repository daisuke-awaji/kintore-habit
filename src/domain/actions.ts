import { weekStart, type DateKey } from './date';
import type { AppData, Condition, Level, Session, Settings, StrengthArea } from './schema';

export function newId(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** その週の目標を、まだ決まっていなければ今の目標で記録しておく */
function snapshotWeekGoal(data: AppData, date: DateKey): AppData['weekGoals'] {
  const ws = weekStart(date);
  if (data.weekGoals[ws] !== undefined) return data.weekGoals;
  return { ...data.weekGoals, [ws]: data.settings.weeklyGoal };
}

export function completeOnboarding(
  data: AppData,
  input: { weeklyGoal: number; anchor: string | null },
  today: DateKey,
): AppData {
  const settings = { ...data.settings, weeklyGoal: input.weeklyGoal, anchor: input.anchor };
  return {
    ...data,
    onboarded: true,
    startDate: data.startDate ?? today,
    settings,
    weekGoals: { ...data.weekGoals, [weekStart(today)]: input.weeklyGoal },
  };
}

export type SessionInput = Omit<Session, 'id' | 'at'> & { id?: string; at?: string };

export function addSession(data: AppData, input: SessionInput, now: Date = new Date()): { data: AppData; session: Session } {
  const session: Session = { ...input, id: input.id ?? newId(), at: input.at ?? now.toISOString() };
  return {
    session,
    data: {
      ...data,
      sessions: [...data.sessions, session],
      // その日に記録したら、回復日の印は外す
      restDays: data.restDays.filter((d) => d !== session.date),
      weekGoals: snapshotWeekGoal(data, session.date),
    },
  };
}

export function updateSession(data: AppData, id: string, patch: Partial<Omit<Session, 'id'>>): AppData {
  return { ...data, sessions: data.sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)) };
}

export function deleteSession(data: AppData, id: string): AppData {
  return { ...data, sessions: data.sessions.filter((s) => s.id !== id) };
}

export function setRestDay(data: AppData, date: DateKey, on: boolean): AppData {
  const without = data.restDays.filter((d) => d !== date);
  return { ...data, restDays: on ? [...without, date] : without };
}

export function setCondition(data: AppData, date: DateKey, value: Condition): AppData {
  return { ...data, condition: { date, value } };
}

export function setLevel(data: AppData, area: StrengthArea, level: Level): AppData {
  return { ...data, levels: { ...data.levels, [area]: level } };
}

/** 週の目標を変えたら、今週から新しい目標にする（過去の週はそのまま） */
export function updateSettings(data: AppData, patch: Partial<Settings>, today: DateKey): AppData {
  const settings = { ...data.settings, ...patch };
  const weekGoals =
    patch.weeklyGoal !== undefined ? { ...data.weekGoals, [weekStart(today)]: patch.weeklyGoal } : data.weekGoals;
  return { ...data, settings, weekGoals };
}

export function dismiss(data: AppData, key: string): AppData {
  if (data.dismissed.includes(key)) return data;
  return { ...data, dismissed: [...data.dismissed, key] };
}
