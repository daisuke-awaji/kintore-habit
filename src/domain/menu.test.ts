import { describe, expect, it } from 'vitest';
import { levelProposal, suggestMenu } from './menu';
import { dataWith, session } from './testdata';

const today = '2026-10-23';

describe('今日のメニュー', () => {
  it('ふつうの日は、次の部位を今のレベルで', () => {
    const d = dataWith({ levels: { lower: 1, upper: 2, core: 1 }, sessions: [session('2026-10-21', { area: 'lower' })] });
    const m = suggestMenu(d, today);
    expect(m.area).toBe('upper');
    expect(m.level).toBe(2);
    expect(m.exerciseId).toBe('knee-pushup');
    expect(m.light).toBe(false);
  });
  it('筋肉痛の日は回復のストレッチ', () => {
    const d = dataWith({ condition: { date: today, value: 'sore' } });
    const m = suggestMenu(d, today);
    expect(m.area).toBe('recovery');
    expect(m.exerciseId).toBe('stretch');
    expect(m.note).toContain('筋肉痛');
  });
  it('痛みがある日はストレッチと注意書き', () => {
    const d = dataWith({ condition: { date: today, value: 'pain' } });
    const m = suggestMenu(d, today);
    expect(m.area).toBe('recovery');
    expect(m.caution).toContain('医療機関');
  });
  it('疲れぎみの日は1段階軽く（レベル1より下にはしない）', () => {
    const d = dataWith({ levels: { lower: 2, upper: 1, core: 1 }, condition: { date: today, value: 'tired' } });
    const m = suggestMenu(d, today);
    expect(m.level).toBe(1);
    expect(m.light).toBe(true);
    const d1 = dataWith({ levels: { lower: 1, upper: 1, core: 1 }, condition: { date: today, value: 'tired' } });
    expect(suggestMenu(d1, today).level).toBe(1);
  });
  it('昨日の体の調子は今日に持ち越さない', () => {
    const d = dataWith({ condition: { date: '2026-10-22', value: 'sore' } });
    expect(suggestMenu(d, today).area).toBe('lower');
  });
  it('おかえりの日は軽め', () => {
    const d = dataWith({ levels: { lower: 3, upper: 3, core: 3 }, sessions: [session('2026-10-01', { area: 'core', level: 3 })] });
    const m = suggestMenu(d, today);
    expect(m.area).toBe('lower');
    expect(m.level).toBe(2);
    expect(m.note).toContain('軽め');
  });
  it('部位を選び直せる', () => {
    const d = dataWith({ condition: { date: today, value: 'sore' } });
    expect(suggestMenu(d, today, 'core').area).toBe('core');
    expect(suggestMenu(dataWith(), today, 'recovery').exerciseId).toBe('stretch');
  });
});

describe('レベル変更の提案', () => {
  const base = dataWith({ levels: { lower: 2, upper: 1, core: 3 } });
  it('物足りない → 1段階上げる', () => {
    const p = levelProposal(base, session(today, { area: 'lower', level: 2, feeling: 'easy' }));
    expect(p).toEqual({ area: 'lower', from: 2, to: 3, direction: 'up' });
  });
  it('一番上のレベルなら提案しない', () => {
    expect(levelProposal(base, session(today, { area: 'core', level: 3, feeling: 'easy' }))).toBeNull();
  });
  it('軽めでやって物足りなかったときは提案しない（次回は元のレベルに戻るため）', () => {
    expect(levelProposal(base, session(today, { area: 'lower', level: 1, feeling: 'easy' }))).toBeNull();
  });
  it('きつかった → 1段階下げる。レベル1なら提案しない', () => {
    expect(levelProposal(base, session(today, { area: 'lower', level: 2, feeling: 'hard' }))).toEqual({
      area: 'lower', from: 2, to: 1, direction: 'down',
    });
    expect(levelProposal(base, session(today, { area: 'upper', level: 1, feeling: 'hard' }))).toBeNull();
  });
  it('ちょうどいい・ストレッチは提案しない', () => {
    expect(levelProposal(base, session(today, { area: 'lower', level: 2, feeling: 'ok' }))).toBeNull();
    expect(levelProposal(base, session(today, { kind: 'recovery', area: 'recovery', feeling: 'hard' }))).toBeNull();
  });
});
