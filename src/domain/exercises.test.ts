import { describe, expect, it } from 'vitest';
import { EXERCISES, WORKOUT_SECONDS, exerciseFor, positionAt, totalSeconds } from './exercises';
import { STRENGTH_AREAS } from './schema';
import { BODY, interpolateSkeleton, skeletonOf, solveMid } from './pose';

const dist = (a: readonly [number, number], b: readonly [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

describe('種目', () => {
  it('どの種目も合計60秒', () => {
    for (const ex of EXERCISES) expect(totalSeconds(ex), ex.id).toBe(WORKOUT_SECONDS);
  });
  it('区間で使うポーズと見本のポーズがすべて定義されている', () => {
    for (const ex of EXERCISES) {
      for (const seg of ex.segments) {
        expect(ex.poses[seg.from], `${ex.id} ${seg.from}`).toBeDefined();
        expect(ex.poses[seg.to], `${ex.id} ${seg.to}`).toBeDefined();
      }
      for (const p of ex.preview) expect(ex.poses[p], `${ex.id} preview ${p}`).toBeDefined();
    }
  });
  it('筋トレの各部位にレベル1〜3がある', () => {
    for (const area of STRENGTH_AREAS) for (const lv of [1, 2, 3] as const) expect(exerciseFor(area, lv).area).toBe(area);
  });
  it('回数の目安が区間の数と合っている', () => {
    for (const ex of EXERCISES.filter((e) => e.reps)) {
      const maxRep = Math.max(...ex.segments.map((s) => s.rep ?? 0));
      expect(maxRep, ex.id).toBe(ex.reps);
    }
  });
  it('経過時間から区間を求める', () => {
    const ex = exerciseFor('lower', 2); // 2秒・2秒 ×15
    expect(positionAt(ex, 0).index).toBe(0);
    expect(positionAt(ex, 1).progress).toBeCloseTo(0.5);
    expect(positionAt(ex, 2.5).segment.label).toBe('上へ');
    expect(positionAt(ex, 30).segment.rep).toBe(8);
    expect(positionAt(ex, 999).index).toBe(ex.segments.length - 1);
  });
});

describe('ポーズの計算', () => {
  it('届く距離なら、腕と脚の長さが保たれる', () => {
    const mid = solveMid([0, 0], [30, 10], 20, 18, 1);
    expect(dist([0, 0], mid)).toBeCloseTo(20, 5);
    expect(dist(mid, [30, 10])).toBeCloseTo(18, 5);
  });
  it('全種目の全ポーズで、ひざとひじの位置が計算できる', () => {
    for (const ex of EXERCISES) {
      for (const [name, pose] of Object.entries(ex.poses)) {
        const sk = skeletonOf(pose);
        for (const v of [...sk.elbow, ...sk.knee, ...sk.head]) expect(Number.isFinite(v), `${ex.id}.${name}`).toBe(true);
        // 脚が伸びきるポーズでは少しだけ伸ばして描く（15%まで）
        if (!pose.knee) expect(dist(sk.hip, sk.knee), `${ex.id}.${name} thigh`).toBeLessThanOrEqual(BODY.thigh * 1.15);
      }
    }
  });
  it('補間の途中でも、指定のない関節は長さが保たれる', () => {
    const ex = exerciseFor('lower', 2);
    const sk = interpolateSkeleton(ex.poses.top, ex.poses.bottom, 0.5);
    expect(dist(sk.hip, sk.knee)).toBeCloseTo(BODY.thigh, 3);
    expect(dist(sk.knee, sk.foot)).toBeCloseTo(BODY.shin, 3);
  });
});
