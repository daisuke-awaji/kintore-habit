import { addDays, weekStart, type DateKey } from '../domain/date';
import { exerciseFor } from '../domain/exercises';
import { createDefaultData, type AppData, type Session, type StrengthArea } from '../domain/schema';

/** 画面テスト用の記録（month: 32日分 / welcome: 9日あいた人 / rest: 今日が回復日） */
export function buildScenario(name: string, today: DateKey): AppData {
  const d = createDefaultData();
  const start = addDays(today, -31);
  const areas: StrengthArea[] = ['lower', 'upper', 'core'];
  let offsets = [-31, -29, -26, -24, -22, -19, -17, -15, -12, -10, -8, -5, -3, -1];
  if (name === 'welcome') offsets = offsets.filter((o) => o <= -9);
  const sessions: Session[] = offsets.map((o, i) => {
    const area = areas[i % 3];
    const level = (o > -15 && area !== 'upper' ? 2 : 1) as 1 | 2;
    return {
      id: `seed-${i}`, date: addDays(today, o), at: `${addDays(today, o)}T12:00:00.000Z`, kind: 'workout', area,
      exerciseId: exerciseFor(area, level).id, level, durationSec: 60, completed: true, feeling: 'ok',
    };
  });
  const weekGoals: Record<string, number> = {};
  for (let ws = weekStart(start); ws <= today; ws = addDays(ws, 7)) weekGoals[ws] = 2;
  return {
    ...d,
    onboarded: true,
    startDate: start,
    settings: { ...d.settings, weeklyGoal: 2, anchor: '歯みがきの後' },
    sessions,
    restDays: name === 'rest' ? [addDays(today, -20), today] : [addDays(today, -20)],
    weekGoals,
    levels: { lower: 2, upper: 1, core: 2 },
  };
}
