import type { DateKey } from './date';
import { type AppData, type Area, type Condition, type Level, type Session, type StrengthArea } from './schema';
import { isWelcomeBack, nextArea } from './stats';
import { exerciseFor, RECOVERY_ID } from './exercises';

export interface MenuSuggestion {
  area: Area;
  level: Level;
  exerciseId: string;
  /** いつもより軽くしているか */
  light: boolean;
  note: string | null;
  caution: string | null;
}

const clampLevel = (n: number): Level => (n <= 1 ? 1 : n >= 3 ? 3 : (n as Level));

export function conditionToday(data: AppData, today: DateKey): Condition {
  return data.condition && data.condition.date === today ? data.condition.value : 'normal';
}

const PAIN_CAUTION =
  '痛む部位を使う運動は休みましょう。強い痛みや、なかなか引かない痛みがあるときは、医療機関に相談してください。';

export function suggestMenu(data: AppData, today: DateKey, override?: Area): MenuSuggestion {
  const condition = conditionToday(data, today);
  const welcome = isWelcomeBack(data, today);

  if (override === 'recovery' || (!override && (condition === 'sore' || condition === 'pain'))) {
    return {
      area: 'recovery',
      level: 1,
      exerciseId: RECOVERY_ID,
      light: false,
      note:
        condition === 'sore'
          ? '筋肉痛はふつうのことで、数日で引きます。今日は回復のストレッチがおすすめです。'
          : condition === 'pain'
            ? '今日は休むか、痛くない範囲でストレッチを。'
            : null,
      caution: condition === 'pain' ? PAIN_CAUTION : null,
    };
  }

  const area: StrengthArea = override ?? nextArea(data);
  const light = condition === 'tired' || welcome;
  const current = data.levels[area];
  const level = light ? clampLevel(current - 1) : clampLevel(current);
  return {
    area,
    level,
    exerciseId: exerciseFor(area, level).id,
    light: light && level < current,
    note: welcome
      ? '今日は軽めの1分から始めましょう。'
      : condition === 'tired'
        ? '疲れている日は、いつもより軽めに。'
        : condition === 'sore'
          ? '筋肉痛のところは無理せずに。'
          : null,
    caution: condition === 'pain' ? PAIN_CAUTION : null,
  };
}

export interface LevelProposal {
  area: StrengthArea;
  from: Level;
  to: Level;
  direction: 'up' | 'down';
}

/**
 * 終わったあとの「きつさ」から、次回のレベル変更を提案する（本人が選ぶ）。
 * - 物足りない：今のレベル以上でやった場合だけ、1段階上げる
 * - きつかった：今のレベルでやったなら1段階下げる。軽めでやってもきつかったなら、そのレベルにする
 */
export function levelProposal(data: AppData, session: Session): LevelProposal | null {
  if (session.kind !== 'workout' || !session.area || session.area === 'recovery' || !session.level) return null;
  if (!session.feeling || session.feeling === 'ok') return null;
  const area = session.area;
  const current = data.levels[area] as Level;
  if (session.feeling === 'easy') {
    if (session.level < current || current >= 3) return null;
    return { area, from: current, to: clampLevel(current + 1), direction: 'up' };
  }
  if (current <= 1 && session.level <= 1) return null;
  const to = session.level < current ? clampLevel(session.level) : clampLevel(current - 1);
  if (to === current) return null;
  return { area, from: current, to, direction: 'down' };
}
