import { z } from 'zod';
import { isDateKey } from './date';

export const STRENGTH_AREAS = ['lower', 'upper', 'core'] as const;
export type StrengthArea = (typeof STRENGTH_AREAS)[number];
export type Area = StrengthArea | 'recovery';
export type Level = 1 | 2 | 3;
export type Condition = 'normal' | 'sore' | 'tired' | 'pain';
export type Feeling = 'hard' | 'ok' | 'easy';

const dateKey = z.string().refine(isDateKey, '日付の形式が正しくありません');
const level = z.number().int().min(1).max(3);

export const settingsSchema = z.object({
  weeklyGoal: z.number().int().min(1).max(4),
  dayBoundaryHour: z.number().int().min(0).max(5),
  anchor: z.string().max(40).nullable(),
  voice: z.boolean(),
  sound: z.boolean(),
  vibration: z.boolean(),
  textSize: z.enum(['normal', 'large']),
  theme: z.enum(['system', 'light', 'dark']),
});

export const sessionSchema = z.object({
  id: z.string().min(1).max(64),
  date: dateKey,
  at: z.string().max(40),
  kind: z.enum(['workout', 'recovery', 'other']),
  area: z.enum(['lower', 'upper', 'core', 'recovery']).optional(),
  exerciseId: z.string().max(64).optional(),
  level: level.optional(),
  durationSec: z.number().min(0).max(3600),
  completed: z.boolean(),
  feeling: z.enum(['hard', 'ok', 'easy']).optional(),
  backfilled: z.boolean().optional(),
  stoppedForPain: z.boolean().optional(),
});

export const appDataSchema = z.object({
  version: z.literal(1),
  createdAt: z.string().max(40),
  onboarded: z.boolean(),
  startDate: dateKey.nullable(),
  settings: settingsSchema,
  sessions: z.array(sessionSchema).max(20000).default([]),
  restDays: z.array(dateKey).max(20000).default([]),
  weekGoals: z.record(z.string(), z.number().int().min(1).max(4)).default({}),
  levels: z.object({ lower: level, upper: level, core: level }),
  condition: z
    .object({ date: dateKey, value: z.enum(['normal', 'sore', 'tired', 'pain']) })
    .nullable()
    .default(null),
  dismissed: z.array(z.string().max(64)).max(200).default([]),
});

export type Settings = z.infer<typeof settingsSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type AppData = z.infer<typeof appDataSchema>;

export const DEFAULT_SETTINGS: Settings = {
  weeklyGoal: 2,
  dayBoundaryHour: 4,
  anchor: null,
  voice: true,
  sound: true,
  vibration: true,
  textSize: 'normal',
  theme: 'system',
};

export function createDefaultData(now: Date = new Date()): AppData {
  return {
    version: 1,
    createdAt: now.toISOString(),
    onboarded: false,
    startDate: null,
    settings: { ...DEFAULT_SETTINGS },
    sessions: [],
    restDays: [],
    weekGoals: {},
    levels: { lower: 1, upper: 1, core: 1 },
    condition: null,
    dismissed: [],
  };
}

export const AREA_LABEL: Record<Area, string> = {
  lower: '下半身',
  upper: '上半身',
  core: '体幹',
  recovery: 'ストレッチ',
};

export const CONDITION_LABEL: Record<Condition, string> = {
  normal: 'ふつう',
  sore: '筋肉痛',
  tired: '疲れぎみ',
  pain: '痛みがある',
};

export const FEELING_LABEL: Record<Feeling, string> = {
  hard: 'きつかった',
  ok: 'ちょうどいい',
  easy: '物足りない',
};
