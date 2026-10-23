import { useEffect, useState } from 'react';
import type { Exercise, Pt } from '../domain/exercises';
import { BODY, easeInOut, interpolateSkeleton, skeletonOf, type Skeleton } from '../domain/pose';
import { useReducedMotion } from '../services/platform';

const p = (pt: Pt) => `${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`;

function Props({ prop }: { prop?: Exercise['prop'] }) {
  if (prop === 'chair') {
    return (
      <g className="fig-prop">
        <path d="M58 64 V128 M58 100 H90 M90 100 V128" />
      </g>
    );
  }
  if (prop === 'wall') {
    return (
      <g className="fig-prop">
        <path d="M172 6 V128" />
        <path className="fig-hatch" d="M172 20 l8 -8 M172 44 l8 -8 M172 68 l8 -8 M172 92 l8 -8 M172 116 l8 -8" />
      </g>
    );
  }
  return null;
}

export function FigureSvg({ skeleton, prop, label, className }: { skeleton: Skeleton; prop?: Exercise['prop']; label: string; className?: string }) {
  const s = skeleton;
  return (
    <svg className={`figure ${className ?? ''}`} viewBox="0 0 200 140" role="img" aria-label={label}>
      <line className="fig-floor" x1="8" y1="129.5" x2="192" y2="129.5" />
      <Props prop={prop} />
      {s.foot2 && s.knee2 && (
        <path className="fig-back" d={`M${p(s.hip)} L${p(s.knee2)} L${p(s.foot2)} L${p(s.toe2 ?? s.foot2)}`} />
      )}
      <g className="fig-body">
        <path d={`M${p(s.neck)} L${p(s.hip)}`} />
        <path d={`M${p(s.hip)} L${p(s.knee)} L${p(s.foot)} L${p(s.toe)}`} />
        <path d={`M${p(s.shoulder)} L${p(s.elbow)} L${p(s.hand)}`} />
      </g>
      <circle className="fig-head" cx={s.head[0]} cy={s.head[1]} r={BODY.headRadius} />
    </svg>
  );
}

/** 開始前の見本：2つのポーズをゆっくり行き来する（動きを減らす設定なら止める） */
export function PreviewFigure({ exercise, className }: { exercise: Exercise; className?: string }) {
  const reduced = useReducedMotion();
  const [t, setT] = useState(0);
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      const cycle = ((now - start) / 1000) % 3.2; // 1.6秒ずつ行き来
      const x = cycle < 1.6 ? cycle / 1.6 : 2 - cycle / 1.6;
      setT(easeInOut(x));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);
  const [a, b] = exercise.preview;
  const sk = reduced ? skeletonOf(exercise.poses[b]) : interpolateSkeleton(exercise.poses[a], exercise.poses[b], t);
  return <FigureSvg skeleton={sk} prop={exercise.prop} label={`${exercise.name}の見本`} className={className} />;
}

/** 一覧などで使う止まった絵 */
export function StaticFigure({ exercise, className }: { exercise: Exercise; className?: string }) {
  const pose = exercise.poses[exercise.preview[1]];
  return <FigureSvg skeleton={skeletonOf(pose)} prop={exercise.prop} label={`${exercise.name}のイラスト`} className={className} />;
}
