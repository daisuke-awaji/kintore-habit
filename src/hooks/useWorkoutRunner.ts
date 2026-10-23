import { useCallback, useEffect, useRef, useState } from 'react';
import { positionAt, totalSeconds, type Exercise, type Segment } from '../domain/exercises';

export type Phase = 'ready' | 'countdown' | 'running' | 'paused' | 'finished';

export interface RunnerHandlers {
  onCountdown?: (n: number) => void;
  onStart?: () => void;
  onSegment?: (segment: Segment, index: number) => void;
  /** 1秒ごと（経過秒・残り秒） */
  onSecond?: (elapsedSec: number, remainingSec: number) => void;
  onFinish?: () => void;
}

/** 1分のタイマー。performance.now() で測り、一時停止中は進めない。画面を切り替えたら自動で一時停止する */
export function useWorkoutRunner(exercise: Exercise, handlers: RunnerHandlers) {
  const total = totalSeconds(exercise);
  const [phase, setPhase] = useState<Phase>('ready');
  const [elapsed, setElapsed] = useState(0);
  const [count, setCount] = useState(3);
  const [autoPaused, setAutoPaused] = useState(false);

  const h = useRef(handlers);
  h.current = handlers;
  const phaseRef = useRef<Phase>('ready');
  const base = useRef(0);
  const startTs = useRef(0);
  const raf = useRef(0);
  const lastSeg = useRef(-1);
  const lastSecond = useRef(-1);
  const timers = useRef<number[]>([]);

  const setP = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const current = useCallback(
    () => (phaseRef.current === 'running' ? Math.min(total, base.current + (performance.now() - startTs.current) / 1000) : base.current),
    [total],
  );

  const frame = useCallback(() => {
    const e = Math.min(total, base.current + (performance.now() - startTs.current) / 1000);
    setElapsed(e);
    const pos = positionAt(exercise, e);
    if (pos.index !== lastSeg.current) {
      lastSeg.current = pos.index;
      h.current.onSegment?.(pos.segment, pos.index);
    }
    const sec = Math.floor(e);
    if (sec !== lastSecond.current) {
      lastSecond.current = sec;
      h.current.onSecond?.(sec, total - sec);
    }
    if (e >= total) {
      base.current = total;
      setP('finished');
      h.current.onFinish?.();
      return;
    }
    raf.current = requestAnimationFrame(frame);
  }, [exercise, total]);

  const begin = useCallback(() => {
    base.current = 0;
    lastSeg.current = -1;
    lastSecond.current = -1;
    startTs.current = performance.now();
    setP('running');
    h.current.onStart?.();
    raf.current = requestAnimationFrame(frame);
  }, [frame]);

  const start = useCallback(() => {
    clearTimers();
    setAutoPaused(false);
    setElapsed(0);
    setP('countdown');
    setCount(3);
    h.current.onCountdown?.(3);
    timers.current.push(window.setTimeout(() => { setCount(2); h.current.onCountdown?.(2); }, 1000));
    timers.current.push(window.setTimeout(() => { setCount(1); h.current.onCountdown?.(1); }, 2000));
    timers.current.push(window.setTimeout(begin, 3000));
  }, [begin]);

  const pause = useCallback(
    (auto = false) => {
      if (phaseRef.current === 'countdown') {
        clearTimers();
        setP('ready');
        return;
      }
      if (phaseRef.current !== 'running') return;
      cancelAnimationFrame(raf.current);
      base.current = current();
      phaseRef.current = 'paused';
      setElapsed(base.current);
      setAutoPaused(auto);
      setPhase('paused');
    },
    [current],
  );

  const resume = useCallback(() => {
    if (phaseRef.current !== 'paused') return;
    startTs.current = performance.now();
    setAutoPaused(false);
    setP('running');
    raf.current = requestAnimationFrame(frame);
  }, [frame]);

  const stop = useCallback(() => {
    clearTimers();
    cancelAnimationFrame(raf.current);
    if (phaseRef.current === 'running') base.current = current();
    phaseRef.current = 'finished';
  }, [current]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') pause(true);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [pause]);

  // 種目が変わったら最初から
  useEffect(() => {
    clearTimers();
    cancelAnimationFrame(raf.current);
    base.current = 0;
    setElapsed(0);
    setAutoPaused(false);
    setP('ready');
    return () => {
      clearTimers();
      cancelAnimationFrame(raf.current);
    };
  }, [exercise]);

  return { phase, elapsed, total, count, autoPaused, start, pause, resume, stop, getElapsed: current };
}
