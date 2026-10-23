import type { Area, Level, StrengthArea } from './schema';

/** 横から見た棒人間のポーズ。ひじ・ひざは省略すると自動で計算する（腕と脚の長さは一定） */
export type Pt = readonly [number, number];
export interface PoseSpec {
  neck: Pt;
  hip: Pt;
  hand: Pt;
  foot: Pt;
  toe: Pt;
  elbow?: Pt;
  knee?: Pt;
  /** 奥側の脚（ストレッチなどで使う） */
  foot2?: Pt;
  toe2?: Pt;
  knee2?: Pt;
}

export type SoundCue = 'down' | 'up' | 'hold' | 'rest' | 'switch' | 'none';

export interface Segment {
  /** 画面に大きく出す合図 */
  label: string;
  sec: number;
  from: string;
  to: string;
  sound: SoundCue;
  /** 区間の始まりに読み上げる言葉 */
  say?: string;
  /** 回数の目安（下へ／上へ の1往復を1回） */
  rep?: number;
  /** ポーズの切り替えにかける秒数（キープや休けいで使う。省略時は区間全体で動く） */
  transitionSec?: number;
}

export interface Exercise {
  id: string;
  area: Area;
  level: Level;
  name: string;
  /** 1分の中身の説明 */
  summary: string;
  points: string[];
  caution?: string;
  prop?: 'chair' | 'wall';
  poses: Record<string, PoseSpec>;
  segments: Segment[];
  /** 開始前の見本で交互に見せる2つのポーズ */
  preview: [string, string];
  reps?: number;
}

export const WORKOUT_SECONDS = 60;
export const COMMON_CAUTION = '痛みや気分の悪さを感じたら、すぐにやめましょう。';

function tempo(reps: number, downSec: number, upSec: number, downLabel: string, upLabel: string): Segment[] {
  const out: Segment[] = [];
  for (let i = 1; i <= reps; i++) {
    out.push({ label: downLabel, sec: downSec, from: 'top', to: 'bottom', sound: 'down', rep: i });
    out.push({ label: upLabel, sec: upSec, from: 'bottom', to: 'top', sound: 'up', rep: i });
  }
  return out;
}

// ---- ポーズ（床は y=128、右向き） ----
const STAND_ARMS_FORWARD: PoseSpec = { neck: [100, 38], hip: [100, 80], hand: [138, 44], foot: [100, 128], toe: [111, 128] };
const SQUAT_BOTTOM: PoseSpec = { neck: [96, 60], hip: [80, 98], hand: [134, 62], foot: [100, 128], toe: [111, 128] };
const CHAIR_TOP: PoseSpec = { neck: [102, 38], hip: [102, 80], hand: [140, 44], foot: [104, 128], toe: [115, 128] };
const CHAIR_BOTTOM: PoseSpec = { neck: [96, 59], hip: [79, 96], hand: [133, 60], foot: [104, 128], toe: [115, 128] };

const WALL_TOP: PoseSpec = { neck: [127.8, 42.4], hip: [114.8, 82.3], hand: [168, 46], foot: [100, 128], toe: [111, 128] };
const WALL_BOTTOM: PoseSpec = { neck: [142.2, 48.5], hip: [122.5, 85.6], hand: [168, 46], foot: [100, 128], toe: [111, 128] };

const KNEE_PUSH_TOP: PoseSpec = { neck: [133.9, 85.3], hip: [100, 110], hand: [132, 128], foot: [58, 116], toe: [52, 111] };
const KNEE_PUSH_BOTTOM: PoseSpec = { neck: [139.6, 104.1], hip: [100, 118], hand: [132, 128], foot: [58, 116], toe: [52, 111] };

const PUSH_TOP: PoseSpec = { neck: [130.5, 91], hip: [91.1, 105.5], hand: [128, 128], foot: [46, 122], toe: [40, 128] };
const PUSH_BOTTOM: PoseSpec = { neck: [134.9, 107.9], hip: [93.4, 114.5], hand: [128, 128], foot: [46, 122], toe: [40, 128] };

const PLANK: PoseSpec = { neck: [134.4, 105.1], hip: [93.1, 113], elbow: [131, 126], hand: [154, 126.5], foot: [46, 122], toe: [40, 128] };
const KNEE_PLANK: PoseSpec = { neck: [139.1, 103.6], hip: [100, 119], elbow: [135, 126], hand: [158, 126.5], foot: [58, 114], toe: [52, 109] };
const ALL_FOURS_REST: PoseSpec = { neck: [131, 88], hip: [88, 102], knee: [88, 126], hand: [128, 128], foot: [64, 126], toe: [58, 126] };

const STAND_ARMS_DOWN: PoseSpec = { neck: [100, 38], hip: [100, 80], hand: [101, 80], foot: [100, 128], toe: [111, 128] };
const STAND_ARMS_UP: PoseSpec = { neck: [100, 37], hip: [100, 80], hand: [102, 4], foot: [100, 128], toe: [111, 128] };
const SHOULDER = (elbow: Pt): PoseSpec => ({ neck: [100, 38], hip: [100, 80], hand: [103, 41], elbow, foot: [100, 128], toe: [111, 128] });
const HAMSTRING_A: PoseSpec = {
  neck: [122.2, 57], hip: [90, 84], hand: [113, 103], foot: [124, 124], toe: [129, 113], foot2: [86, 128], toe2: [97, 128],
};
const HAMSTRING_B: PoseSpec = {
  neck: [126, 64], hip: [88, 86], hand: [116, 108], foot: [124, 124], toe: [129, 113], foot2: [86, 128], toe2: [97, 128],
};

export const RECOVERY_ID = 'stretch';

const recoverySegments: Segment[] = [
  ...Array.from({ length: 5 }, (_, i): Segment[] => [
    { label: '肩を回す', sec: 1, from: 'sh-front', to: 'sh-up', sound: 'none', say: i === 0 ? '肩をゆっくり回します' : undefined },
    { label: '肩を回す', sec: 1, from: 'sh-up', to: 'sh-back', sound: 'none' },
    { label: '肩を回す', sec: 1, from: 'sh-back', to: 'sh-down', sound: 'none' },
    { label: '肩を回す', sec: 1, from: 'sh-down', to: 'sh-front', sound: 'none' },
  ]).flat(),
  { label: '上に伸びる', sec: 5, from: 'arms-down', to: 'arms-up', sound: 'switch', say: '両手を上に伸ばして' },
  { label: 'ゆるめる', sec: 5, from: 'arms-up', to: 'arms-down', sound: 'switch', say: 'ゆるめて' },
  { label: '上に伸びる', sec: 5, from: 'arms-down', to: 'arms-up', sound: 'switch', say: 'もう一度、上に' },
  { label: 'ゆるめる', sec: 5, from: 'arms-up', to: 'arms-down', sound: 'switch', say: 'ゆるめて' },
  { label: '右脚の裏をのばす', sec: 10, from: 'hs-a', to: 'hs-b', sound: 'switch', say: '右のかかとを前に出して、太ももの裏を伸ばします' },
  { label: '左脚の裏をのばす', sec: 10, from: 'hs-a', to: 'hs-b', sound: 'switch', say: '反対の脚' },
];

export const EXERCISES: Exercise[] = [
  {
    id: 'chair-squat', area: 'lower', level: 1, name: '椅子スクワット', prop: 'chair', reps: 10,
    summary: '3秒で座って、3秒で立つ。10回',
    points: ['椅子の前に立ち、足は肩幅に開く', '3秒かけてゆっくり座り、3秒で立ち上がる', 'ひざが内側に入らないように'],
    caution: 'ぐらつかない椅子を使いましょう。',
    poses: { top: CHAIR_TOP, bottom: CHAIR_BOTTOM }, preview: ['top', 'bottom'],
    segments: tempo(10, 3, 3, '座る', '立つ'),
  },
  {
    id: 'squat', area: 'lower', level: 2, name: 'スクワット', reps: 15,
    summary: '2秒で下りて、2秒で上がる。15回',
    points: ['足は肩幅、つま先は少し外向き', 'お尻を後ろに引くように下りる', 'ひざが内側に入らないように'],
    poses: { top: STAND_ARMS_FORWARD, bottom: SQUAT_BOTTOM }, preview: ['top', 'bottom'],
    segments: tempo(15, 2, 2, '下へ', '上へ'),
  },
  {
    id: 'slow-squat', area: 'lower', level: 3, name: 'ゆっくりスクワット', reps: 10,
    summary: '4秒かけて下りて、2秒で上がる。10回',
    points: ['4秒かけてゆっくり下りる', '背中はまっすぐ', 'きつければ浅くてもOK'],
    poses: { top: STAND_ARMS_FORWARD, bottom: SQUAT_BOTTOM }, preview: ['top', 'bottom'],
    segments: tempo(10, 4, 2, '下へ', '上へ'),
  },
  {
    id: 'wall-pushup', area: 'upper', level: 1, name: '壁腕立て', prop: 'wall', reps: 15,
    summary: '壁に手をついて、2秒で曲げて、2秒で押す。15回',
    points: ['壁から一歩はなれて立ち、手は肩の高さで壁につく', '体をまっすぐにしたまま、胸を壁に近づける', '肩をすくめない'],
    caution: 'すべりにくい靴下か、はだしで。',
    poses: { top: WALL_TOP, bottom: WALL_BOTTOM }, preview: ['top', 'bottom'],
    segments: tempo(15, 2, 2, '曲げる', '押す'),
  },
  {
    id: 'knee-pushup', area: 'upper', level: 2, name: '膝つき腕立て', reps: 15,
    summary: 'ひざをついて、2秒で下ろして、2秒で押す。15回',
    points: ['ひざをつき、手は肩の真下より少し外', '頭からひざまでまっすぐ', '下ろすときは胸から'],
    caution: '床が硬ければ、ひざの下にタオルを敷きましょう。',
    poses: { top: KNEE_PUSH_TOP, bottom: KNEE_PUSH_BOTTOM }, preview: ['top', 'bottom'],
    segments: tempo(15, 2, 2, '下ろす', '押す'),
  },
  {
    id: 'pushup', area: 'upper', level: 3, name: '腕立て伏せ', reps: 12,
    summary: '3秒で下ろして、2秒で押す。12回',
    points: ['頭からかかとまでまっすぐ', '3秒かけて下ろす', 'きつければ、途中からひざをついてOK'],
    poses: { top: PUSH_TOP, bottom: PUSH_BOTTOM }, preview: ['top', 'bottom'],
    segments: tempo(12, 3, 2, '下ろす', '押す'),
  },
  {
    id: 'knee-plank', area: 'core', level: 1, name: '膝つきプランク',
    summary: 'ひざをついて15秒キープを3回（間に休けい）',
    points: ['ひじは肩の真下、ひざをつく', '頭からひざまでまっすぐ', '息を止めない'],
    caution: '床が硬ければ、ひじとひざの下にタオルを敷きましょう。',
    poses: { hold: KNEE_PLANK, rest: ALL_FOURS_REST }, preview: ['rest', 'hold'],
    segments: [
      { label: 'キープ', sec: 15, from: 'hold', to: 'hold', sound: 'hold', say: 'キープ' },
      { label: '休けい', sec: 7, from: 'hold', to: 'rest', sound: 'rest', say: '休けい', transitionSec: 1.2 },
      { label: 'キープ', sec: 15, from: 'rest', to: 'hold', sound: 'hold', say: 'キープ', transitionSec: 1.2 },
      { label: '休けい', sec: 8, from: 'hold', to: 'rest', sound: 'rest', say: '休けい', transitionSec: 1.2 },
      { label: 'キープ', sec: 15, from: 'rest', to: 'hold', sound: 'hold', say: '最後のキープ', transitionSec: 1.2 },
    ],
  },
  {
    id: 'plank', area: 'core', level: 2, name: 'プランク',
    summary: '15秒キープを3回（間に休けい）',
    points: ['ひじは肩の真下', '頭からかかとまでまっすぐ。お尻を上げすぎない', '息を止めない'],
    caution: '床が硬ければ、ひじの下にタオルを敷きましょう。',
    poses: { hold: PLANK, rest: ALL_FOURS_REST }, preview: ['rest', 'hold'],
    segments: [
      { label: 'キープ', sec: 15, from: 'hold', to: 'hold', sound: 'hold', say: 'キープ' },
      { label: '休けい', sec: 7, from: 'hold', to: 'rest', sound: 'rest', say: '休けい', transitionSec: 1.2 },
      { label: 'キープ', sec: 15, from: 'rest', to: 'hold', sound: 'hold', say: 'キープ', transitionSec: 1.2 },
      { label: '休けい', sec: 8, from: 'hold', to: 'rest', sound: 'rest', say: '休けい', transitionSec: 1.2 },
      { label: 'キープ', sec: 15, from: 'rest', to: 'hold', sound: 'hold', say: '最後のキープ', transitionSec: 1.2 },
    ],
  },
  {
    id: 'plank-long', area: 'core', level: 3, name: '長めのプランク',
    summary: '25秒キープを2回（間に休けい）',
    points: ['ひじは肩の真下', '頭からかかとまでまっすぐ', 'おなかに軽く力を入れて、息は止めない'],
    caution: '床が硬ければ、ひじの下にタオルを敷きましょう。',
    poses: { hold: PLANK, rest: ALL_FOURS_REST }, preview: ['rest', 'hold'],
    segments: [
      { label: 'キープ', sec: 25, from: 'hold', to: 'hold', sound: 'hold', say: 'キープ' },
      { label: '休けい', sec: 10, from: 'hold', to: 'rest', sound: 'rest', say: '休けい', transitionSec: 1.2 },
      { label: 'キープ', sec: 25, from: 'rest', to: 'hold', sound: 'hold', say: '最後のキープ', transitionSec: 1.2 },
    ],
  },
  {
    id: RECOVERY_ID, area: 'recovery', level: 1, name: '回復のストレッチ',
    summary: '肩回し、背伸び、太ももの裏のストレッチを20秒ずつ',
    points: ['痛くない範囲で、ゆっくり', '呼吸を止めない', '反動をつけない'],
    poses: {
      'sh-front': SHOULDER([120, 42]), 'sh-up': SHOULDER([100, 22]), 'sh-back': SHOULDER([80, 42]), 'sh-down': SHOULDER([100, 62]),
      'arms-down': STAND_ARMS_DOWN, 'arms-up': STAND_ARMS_UP, 'hs-a': HAMSTRING_A, 'hs-b': HAMSTRING_B,
    },
    preview: ['arms-down', 'arms-up'],
    segments: recoverySegments,
  },
];

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));

export function getExercise(id: string): Exercise | undefined {
  return BY_ID.get(id);
}

export function exerciseFor(area: StrengthArea, level: Level): Exercise {
  const found = EXERCISES.find((e) => e.area === area && e.level === level);
  if (!found) throw new Error(`exercise not found: ${area} ${level}`);
  return found;
}

export function totalSeconds(ex: Exercise): number {
  return ex.segments.reduce((sum, s) => sum + s.sec, 0);
}

export interface TimelinePosition {
  index: number;
  segment: Segment;
  /** 区間の中での経過秒 */
  inSegment: number;
  /** 0〜1 */
  progress: number;
}

/** 経過秒から、いまどの区間にいるか */
export function positionAt(ex: Exercise, elapsedSec: number): TimelinePosition {
  let t = Math.max(0, elapsedSec);
  for (let i = 0; i < ex.segments.length; i++) {
    const seg = ex.segments[i];
    if (t < seg.sec || i === ex.segments.length - 1) {
      const inSegment = Math.min(t, seg.sec);
      return { index: i, segment: seg, inSegment, progress: seg.sec > 0 ? inSegment / seg.sec : 1 };
    }
    t -= seg.sec;
  }
  const last = ex.segments[ex.segments.length - 1];
  return { index: ex.segments.length - 1, segment: last, inSegment: last.sec, progress: 1 };
}
