import { describe, expect, it } from 'vitest';
import {
  achievedWeekCount, canEditDay, dayNumberSinceStart, firstLevels, isRestDay, isWelcomeBack, nextArea,
  totalDays, totalMinutes, weekCount, weeksSinceStart, welcomeBackGapDays,
} from './stats';
import { dataWith, session } from './testdata';

describe('回数は「やった日」で数える', () => {
  it('同じ日に2回やっても1回', () => {
    const d = dataWith({ sessions: [session('2026-10-20'), session('2026-10-20'), session('2026-10-22')] });
    expect(weekCount(d, '2026-10-19')).toBe(2);
    expect(totalDays(d)).toBe(2);
    expect(totalMinutes(d)).toBe(3);
  });
});

describe('達成した週', () => {
  it('週ごとの目標で判定し、あとから目標を上げても過去の達成は消えない', () => {
    const d = dataWith({
      settings: { ...dataWith().settings, weeklyGoal: 3 },
      weekGoals: { '2026-10-12': 2 },
      sessions: [session('2026-10-13'), session('2026-10-15'), session('2026-10-20')],
    });
    expect(achievedWeekCount(d)).toBe(1);
  });
});

describe('おかえり判定', () => {
  it('週2回の人は7日あいたら「おかえり」', () => {
    const d = dataWith({ sessions: [session('2026-10-10')] });
    expect(welcomeBackGapDays(2)).toBe(7);
    expect(isWelcomeBack(d, '2026-10-16')).toBe(false);
    expect(isWelcomeBack(d, '2026-10-17')).toBe(true);
  });
  it('ふだんのリズム（中2〜3日）では出さない', () => {
    const d = dataWith({ sessions: [session('2026-10-19')] });
    expect(isWelcomeBack(d, '2026-10-23')).toBe(false);
  });
  it('回復日を付けていた日は「来ていた」と数える', () => {
    const d = dataWith({ sessions: [session('2026-10-05')], restDays: ['2026-10-14'] });
    expect(isWelcomeBack(d, '2026-10-17')).toBe(false);
  });
  it('記録が1つもなければ出さない／今日やっていれば出さない', () => {
    expect(isWelcomeBack(dataWith(), '2026-10-30')).toBe(false);
    const d = dataWith({ sessions: [session('2026-10-01'), session('2026-10-20')] });
    expect(isWelcomeBack(d, '2026-10-20')).toBe(false);
  });
});

describe('次の部位', () => {
  it('はじめは下半身。その後は 下半身 → 上半身 → 体幹', () => {
    expect(nextArea(dataWith())).toBe('lower');
    expect(nextArea(dataWith({ sessions: [session('2026-10-20', { area: 'lower' })] }))).toBe('upper');
    expect(nextArea(dataWith({ sessions: [session('2026-10-20', { area: 'upper' })] }))).toBe('core');
    expect(nextArea(dataWith({ sessions: [session('2026-10-20', { area: 'core' })] }))).toBe('lower');
  });
  it('ストレッチは順番に数えない', () => {
    const d = dataWith({
      sessions: [
        session('2026-10-20', { area: 'upper' }),
        session('2026-10-21', { kind: 'recovery', area: 'recovery', exerciseId: 'stretch', level: undefined }),
      ],
    });
    expect(nextArea(d)).toBe('core');
  });
  it('あと付けした過去の記録より、日付が新しい記録を優先する', () => {
    const d = dataWith({
      sessions: [
        session('2026-10-22', { area: 'upper', at: '2026-10-22T10:00:00.000Z' }),
        session('2026-10-20', { area: 'core', at: '2026-10-23T10:00:00.000Z', backfilled: true }),
      ],
    });
    expect(nextArea(d)).toBe('core');
  });
});

describe('そのほか', () => {
  it('回復日でも、その日に記録があれば記録を優先', () => {
    const d = dataWith({ restDays: ['2026-10-20'], sessions: [session('2026-10-20')] });
    expect(isRestDay(d, '2026-10-20')).toBe(false);
  });
  it('あと付けできるのは始めた日以降・今日から7日前まで', () => {
    const d = dataWith({ startDate: '2026-10-10' });
    expect(canEditDay(d, '2026-10-23', '2026-10-23')).toBe(true);
    expect(canEditDay(d, '2026-10-16', '2026-10-23')).toBe(true);
    expect(canEditDay(d, '2026-10-15', '2026-10-23')).toBe(false);
    expect(canEditDay(d, '2026-10-24', '2026-10-23')).toBe(false);
    expect(canEditDay(dataWith({ startDate: '2026-10-22' }), '2026-10-21', '2026-10-23')).toBe(false);
  });
  it('始めてから何日目か・週の一覧・最初のレベル', () => {
    const d = dataWith({
      startDate: '2026-10-08',
      sessions: [session('2026-10-09', { area: 'lower', level: 1 }), session('2026-10-20', { area: 'lower', level: 2 })],
    });
    expect(dayNumberSinceStart(d, '2026-10-08')).toBe(1);
    expect(dayNumberSinceStart(d, '2026-10-23')).toBe(16);
    expect(weeksSinceStart(d, '2026-10-23')).toEqual(['2026-10-19', '2026-10-12', '2026-10-05']);
    expect(firstLevels(d)).toEqual({ lower: 1 });
  });
});
