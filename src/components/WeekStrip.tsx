import { dayOfMonth, formatDateJa, weekDays, weekdayJa, type DateKey } from '../domain/date';
import type { AppData } from '../domain/schema';
import { hasSessionOn, isRestDay } from '../domain/stats';
import { Icon } from './Icon';

interface Props {
  data: AppData;
  weekStartKey: DateKey;
  today: DateKey;
  /** 押せる日（あと付けなど）を決める。指定がなければ押せない */
  canPress?: (date: DateKey) => boolean;
  onPress?: (date: DateKey) => void;
  size?: 'md' | 'sm';
}

type DayState = 'done' | 'rest' | 'empty' | 'future' | 'before';

export function WeekStrip({ data, weekStartKey, today, canPress, onPress, size = 'md' }: Props) {
  return (
    <ol className={`week week-${size}`} aria-label="この週の記録">
      {weekDays(weekStartKey).map((d) => {
        const state: DayState =
          data.startDate && d < data.startDate && !hasSessionOn(data, d)
            ? 'before'
            : hasSessionOn(data, d)
              ? 'done'
              : isRestDay(data, d)
                ? 'rest'
                : d > today
                  ? 'future'
                  : 'empty';
        const isToday = d === today;
        const stateText =
          state === 'done' ? 'できた' : state === 'rest' ? '回復日' : state === 'future' ? 'これから' : state === 'before' ? '始める前' : '記録なし';
        const label = `${formatDateJa(d)}${isToday ? '（今日）' : ''}：${stateText}`;
        const pressable = !!onPress && !!canPress?.(d);
        const content = (
          <>
            <span className="week-dow" aria-hidden="true">{weekdayJa(d)}</span>
            <span className={`week-mark mark-${state}${isToday ? ' is-today' : ''}`} aria-hidden="true">
              {state === 'done' ? <Icon name="check" size={size === 'sm' ? 16 : 20} strokeWidth={3} /> : state === 'rest' ? '休' : ''}
            </span>
            <span className={`week-date${isToday ? ' is-today' : ''}`} aria-hidden="true">
              {isToday ? '今日' : dayOfMonth(d)}
            </span>
          </>
        );
        return (
          <li key={d} className="week-day">
            {pressable ? (
              <button type="button" className="week-btn" aria-label={`${label}。記録を見る・直す`} onClick={() => onPress?.(d)}>
                {content}
              </button>
            ) : (
              <div className="week-btn is-static" role="img" aria-label={label}>
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
