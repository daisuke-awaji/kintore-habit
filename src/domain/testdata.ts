import { createDefaultData, type AppData, type Session } from './schema';

let seq = 0;
export function session(date: string, patch: Partial<Session> = {}): Session {
  seq += 1;
  return {
    id: `s${seq}`,
    date,
    at: `${date}T20:00:${String(seq % 60).padStart(2, '0')}.000Z`,
    kind: 'workout',
    area: 'lower',
    exerciseId: 'chair-squat',
    level: 1,
    durationSec: 60,
    completed: true,
    ...patch,
  };
}

export function dataWith(patch: Partial<AppData> = {}): AppData {
  const base = createDefaultData(new Date(2026, 9, 1, 9, 0));
  return { ...base, onboarded: true, startDate: '2026-10-01', ...patch };
}
