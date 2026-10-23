import type { PoseSpec, Pt } from './exercises';

/** 体の寸法（SVG の座標単位） */
export const BODY = { upperArm: 20, forearm: 18, thigh: 24, shin: 24, neckToHead: 11, headRadius: 9, shoulderDrop: 4 };

export interface Skeleton {
  head: Pt;
  neck: Pt;
  shoulder: Pt;
  elbow: Pt;
  hand: Pt;
  hip: Pt;
  knee: Pt;
  foot: Pt;
  toe: Pt;
  knee2?: Pt;
  foot2?: Pt;
  toe2?: Pt;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerpPt = (a: Pt, b: Pt, t: number): Pt => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

export function easeInOut(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

function unit(from: Pt, to: Pt): Pt {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const d = Math.hypot(dx, dy) || 1;
  return [dx / d, dy / d];
}

/**
 * 2つの骨（長さ l1, l2）の中間の関節（ひじ・ひざ）を求める。
 * bend は曲がる向き（+1 / -1）。届かないときは、まっすぐ伸ばす。
 */
export function solveMid(root: Pt, end: Pt, l1: number, l2: number, bend: 1 | -1): Pt {
  const dx = end[0] - root[0];
  const dy = end[1] - root[1];
  const d = Math.hypot(dx, dy);
  if (d < 1e-6) return [root[0], root[1] + l1];
  const ux = dx / d;
  const uy = dy / d;
  if (d >= l1 + l2) {
    const r = l1 / (l1 + l2);
    return [root[0] + dx * r, root[1] + dy * r];
  }
  const dd = Math.max(d, Math.abs(l1 - l2) + 1e-6);
  const a = (l1 * l1 - l2 * l2 + dd * dd) / (2 * dd);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const nx = -uy;
  const ny = ux;
  return [root[0] + ux * a + nx * h * bend, root[1] + uy * a + ny * h * bend];
}

const ELBOW_BEND = 1 as const;
const KNEE_BEND = -1 as const;

function derived(neck: Pt, hip: Pt): { head: Pt; shoulder: Pt } {
  const up = unit(hip, neck);
  return {
    head: [neck[0] + up[0] * BODY.neckToHead, neck[1] + up[1] * BODY.neckToHead],
    shoulder: [neck[0] - up[0] * BODY.shoulderDrop, neck[1] - up[1] * BODY.shoulderDrop],
  };
}

export function skeletonOf(p: PoseSpec): Skeleton {
  const { head, shoulder } = derived(p.neck, p.hip);
  const sk: Skeleton = {
    head,
    neck: p.neck,
    shoulder,
    elbow: p.elbow ?? solveMid(shoulder, p.hand, BODY.upperArm, BODY.forearm, ELBOW_BEND),
    hand: p.hand,
    hip: p.hip,
    knee: p.knee ?? solveMid(p.hip, p.foot, BODY.thigh, BODY.shin, KNEE_BEND),
    foot: p.foot,
    toe: p.toe,
  };
  if (p.foot2) {
    sk.foot2 = p.foot2;
    sk.toe2 = p.toe2 ?? p.foot2;
    sk.knee2 = p.knee2 ?? solveMid(p.hip, p.foot2, BODY.thigh, BODY.shin, KNEE_BEND);
  }
  return sk;
}

/**
 * 2つのポーズの間（t=0〜1）。手足の先と胴体は線形に動かし、
 * ひじ・ひざは長さが変わらないように計算し直す（指定があるポーズでは補間する）。
 */
export function interpolateSkeleton(a: PoseSpec, b: PoseSpec, t: number): Skeleton {
  if (t <= 0) return skeletonOf(a);
  if (t >= 1) return skeletonOf(b);
  const neck = lerpPt(a.neck, b.neck, t);
  const hip = lerpPt(a.hip, b.hip, t);
  const hand = lerpPt(a.hand, b.hand, t);
  const foot = lerpPt(a.foot, b.foot, t);
  const toe = lerpPt(a.toe, b.toe, t);
  const { head, shoulder } = derived(neck, hip);
  const ska = skeletonOf(a);
  const skb = skeletonOf(b);
  const elbow =
    a.elbow || b.elbow ? lerpPt(ska.elbow, skb.elbow, t) : solveMid(shoulder, hand, BODY.upperArm, BODY.forearm, ELBOW_BEND);
  const knee = a.knee || b.knee ? lerpPt(ska.knee, skb.knee, t) : solveMid(hip, foot, BODY.thigh, BODY.shin, KNEE_BEND);
  const sk: Skeleton = { head, neck, shoulder, elbow, hand, hip, knee, foot, toe };
  if (a.foot2 || b.foot2) {
    const fa = a.foot2 ?? a.foot;
    const fb = b.foot2 ?? b.foot;
    sk.foot2 = lerpPt(fa, fb, t);
    sk.toe2 = lerpPt(a.toe2 ?? fa, b.toe2 ?? fb, t);
    sk.knee2 = solveMid(hip, sk.foot2, BODY.thigh, BODY.shin, KNEE_BEND);
  }
  return sk;
}
