import { describe, expect, it } from 'vitest';
import { addSession, completeOnboarding, deleteSession, setRestDay, updateSettings } from './actions';
import { achievedWeekCount, weekCount } from './stats';
import { createDefaultData } from './schema';
import { dataWith, session } from './testdata';

describe('データの更新', () => {
  it('はじめての設定を終えると、開始日と今週の目標が決まる', () => {
    const d = completeOnboarding(createDefaultData(), { weeklyGoal: 3, anchor: '歯みがきの後' }, '2026-10-23');
    expect(d.onboarded).toBe(true);
    expect(d.startDate).toBe('2026-10-23');
    expect(d.settings.weeklyGoal).toBe(3);
    expect(d.settings.anchor).toBe('歯みがきの後');
    expect(d.weekGoals['2026-10-19']).toBe(3);
  });
  it('記録すると、その日の回復日の印は外れ、その週の目標が記録される', () => {
    const d0 = dataWith({ restDays: ['2026-10-23'] });
    const { data, session: s } = addSession(d0, {
      date: '2026-10-23', kind: 'workout', area: 'lower', exerciseId: 'chair-squat', level: 1, durationSec: 60, completed: true,
    });
    expect(s.id).toBeTruthy();
    expect(data.restDays).toEqual([]);
    expect(data.weekGoals['2026-10-19']).toBe(2);
    expect(weekCount(data, '2026-10-19')).toBe(1);
  });
  it('目標を変えても、過去の週の達成は変わらない', () => {
    let d = dataWith({ sessions: [] });
    d = addSession(d, { date: '2026-10-13', kind: 'workout', durationSec: 60, completed: true }).data;
    d = addSession(d, { date: '2026-10-15', kind: 'workout', durationSec: 60, completed: true }).data;
    expect(achievedWeekCount(d)).toBe(1);
    d = updateSettings(d, { weeklyGoal: 4 }, '2026-10-23');
    expect(achievedWeekCount(d)).toBe(1);
    expect(d.weekGoals['2026-10-19']).toBe(4);
  });
  it('削除と回復日の切り替え', () => {
    const s = session('2026-10-20');
    let d = dataWith({ sessions: [s] });
    d = deleteSession(d, s.id);
    expect(d.sessions).toHaveLength(0);
    d = setRestDay(d, '2026-10-23', true);
    d = setRestDay(d, '2026-10-23', true);
    expect(d.restDays).toEqual(['2026-10-23']);
    d = setRestDay(d, '2026-10-23', false);
    expect(d.restDays).toEqual([]);
  });
});
