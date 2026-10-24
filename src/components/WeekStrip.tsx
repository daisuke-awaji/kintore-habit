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
  /** 次にやるとよい日（点線の輪で示す） */
  suggest?: DateKey[];
}

type DayState = 'done' | 'rest' | 'empty' | 'future' | 'before';

export function WeekStrip({ data, weekStartKey, today, canPress, onPress, size = 'md', suggest = [] }: Props) {
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
        const suggested = state === 'future' && suggest.includes(d);
        const iconSize = size === 'sm' ? 16 : 20;
        const content = (
          <>
            <span className="week-dow" aria-hidden="true">{weekdayJa(d)}</span>
            <span className={`week-mark mark-${state}${isToday ? ' is-today' : ''}${suggested ? ' is-suggest' : ''}`} aria-hidden="true">
              {state === 'done' ? (
                <Icon name="check" size={iconSize} strokeWidth={3} />
              ) : state === 'rest' ? (
                '休'
              ) : pressable && state === 'empty' ? (
                <Icon name="plus" size={iconSize - 2} strokeWidth={2.5} />
              ) : (
                ''
              )}
            </span>
            <span className={`week-date${isToday ? ' is-today' : ''}`} aria-hidden="true">
              {isToday ? '今日' : dayOfMonth(d)}
            </span>
          </>
        );
        return (
          <li key={d} className="week-day">
            {pressable ? (
              <button type="button" className="week-btn is-editable" aria-label={`${label}。記録を見る・直す`} onClick={() => onPress?.(d)}>
                {content}
              </button>
            ) : (
              <div className="week-btn is-static" role="img" aria-label={suggested ? `${label}（次の候補）` : label}>
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
