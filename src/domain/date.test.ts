import { describe, expect, it } from 'vitest';
import { addDays, diffDays, formatDateJa, formatWeekRange, isDateKey, logicalDate, weekDays, weekStart } from './date';

describe('logicalDate', () => {
  it('区切りの時刻より前は前日になる', () => {
    expect(logicalDate(new Date(2026, 9, 24, 3, 59), 4)).toBe('2026-10-23');
    expect(logicalDate(new Date(2026, 9, 24, 4, 0), 4)).toBe('2026-10-24');
  });
  it('区切りが0時なら暦どおり', () => {
    expect(logicalDate(new Date(2026, 9, 24, 0, 5), 0)).toBe('2026-10-24');
  });
  it('月や年をまたいでも正しい', () => {
    expect(logicalDate(new Date(2026, 10, 1, 2, 0), 4)).toBe('2026-10-31');
    expect(logicalDate(new Date(2027, 0, 1, 1, 0), 4)).toBe('2026-12-31');
  });
});

describe('週の計算（月曜始まり）', () => {
  it('金曜日の週の月曜日', () => {
    expect(weekStart('2026-10-23')).toBe('2026-10-19');
  });
  it('日曜日はその週の最後', () => {
    expect(weekStart('2026-10-25')).toBe('2026-10-19');
    expect(weekStart('2026-10-26')).toBe('2026-10-26');
  });
  it('7日分を返す', () => {
    expect(weekDays('2026-10-26')).toEqual([
      '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01',
    ]);
  });
});

describe('日付の計算と表示', () => {
  it('addDays / diffDays', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(diffDays('2026-10-23', '2026-10-20')).toBe(3);
    expect(diffDays('2027-01-02', '2026-12-30')).toBe(3);
  });
  it('日本語の表示', () => {
    expect(formatDateJa('2026-10-23')).toBe('10月23日(金)');
    expect(formatWeekRange('2026-10-19')).toBe('10月19日〜25日');
    expect(formatWeekRange('2026-10-26')).toBe('10月26日〜11月1日');
  });
  it('isDateKey', () => {
    expect(isDateKey('2026-10-23')).toBe(true);
    expect(isDateKey('2026-02-30')).toBe(false);
    expect(isDateKey('2026/10/23')).toBe(false);
  });
});
