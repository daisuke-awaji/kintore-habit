import { useMemo, useRef, useState } from 'react';
import { Toggle } from '../components/Controls';
import { FigureSvg, PreviewFigure } from '../components/Figure';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { COMMON_CAUTION, RECOVERY_ID, exerciseFor, getExercise, positionAt, type Exercise } from '../domain/exercises';
import { easeInOut, interpolateSkeleton, skeletonOf } from '../domain/pose';
import { AREA_LABEL } from '../domain/schema';
import { useWakeLock } from '../hooks/useWakeLock';
import { useWorkoutRunner } from '../hooks/useWorkoutRunner';
import { navigate } from '../router';
import { cancelSpeech, japaneseVoiceStatus, playCue, speak, unlockAudio, vibrate } from '../services/feedback';
import { requestPersistentStorage, supportsWakeLock, useReducedMotion } from '../services/platform';
import { useAppData } from '../state/AppData';

const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

function easierThan(ex: Exercise): Exercise | null {
  if (ex.area === 'recovery' || ex.level <= 1) return null;
  return exerciseFor(ex.area, (ex.level - 1) as 1 | 2);
}

export function Workout({ params }: { params: URLSearchParams }) {
  const app = useAppData();
  const { data, today } = app;
  const settings = data.settings;
  const exercise = useMemo(() => getExercise(params.get('ex') ?? '') ?? exerciseFor('lower', 1), [params]);
  const isFirst = params.get('first') === '1';
  const light = params.get('light') === '1';
  const reduced = useReducedMotion();
  const [sheet, setSheet] = useState<null | 'stop' | 'pain'>(null);
  const [announce, setAnnounce] = useState('');
  const finished = useRef(false);

  const finish = (completed: boolean, opts: { pain?: boolean } = {}) => {
    if (finished.current) return;
    finished.current = true;
    runner.stop();
    const firstEver = data.sessions.length === 0;
    const session = app.addSession({
      date: today,
      kind: exercise.area === 'recovery' ? 'recovery' : 'workout',
      area: exercise.area,
      exerciseId: exercise.id,
      level: exercise.area === 'recovery' ? undefined : exercise.level,
      durationSec: completed ? runner.total : Math.max(1, Math.round(runner.getElapsed())),
      completed,
      stoppedForPain: opts.pain ? true : undefined,
    });
    if (firstEver) void requestPersistentStorage();
    navigate('/done', { id: session.id }, { replace: true });
  };

  const runner = useWorkoutRunner(exercise, {
    onCountdown: () => settings.sound && playCue('count'),
    onStart: () => {
      if (settings.sound) playCue('start');
      if (settings.voice && !exercise.segments[0].say) speak('はじめ');
    },
    onSegment: (seg, i) => {
      setAnnounce(seg.label);
      if (settings.sound && i > 0 && seg.sound !== 'none') playCue(seg.sound);
      if (settings.voice && seg.say) speak(seg.say);
      if (settings.vibration && (seg.sound === 'hold' || seg.sound === 'rest' || seg.sound === 'switch')) vibrate(80);
    },
    onSecond: (sec, remaining) => {
      const pos = positionAt(exercise, sec);
      const busy = pos.inSegment < 1.5 && !!pos.segment.say;
      if (settings.voice && !busy && sec === 30) speak('半分');
      if (settings.voice && !busy && remaining === 10) speak('あと10秒');
      if (settings.sound && remaining >= 1 && remaining <= 3) playCue('count');
    },
    onFinish: () => {
      if (settings.sound) playCue('end');
      if (settings.voice) speak('おわり。おつかれさまでした');
      if (settings.vibration) vibrate([120, 80, 120]);
      finish(true);
    },
  });

  useWakeLock(runner.phase === 'countdown' || runner.phase === 'running' || runner.phase === 'paused');

  const onStart = () => {
    finished.current = false;
    unlockAudio();
    if (settings.voice) speak('では、始めます');
    runner.start();
  };
  const quit = () => {
    runner.stop();
    cancelSpeech();
    navigate('/', undefined, { replace: true });
  };
  const switchTo = (ex: Exercise) => {
    runner.stop();
    cancelSpeech();
    setSheet(null);
    navigate('/workout', { ex: ex.id, light: 1 }, { replace: true });
  };

  const voiceStatus = japaneseVoiceStatus();
  const easier = easierThan(exercise);
  const recovery = getExercise(RECOVERY_ID)!;

  const stopSheet = (
    <Sheet open={sheet !== null} title={sheet === 'pain' ? '無理しないでください' : 'やめますか？'} onClose={() => setSheet(null)}>
      {sheet === 'pain' && (
        <p>痛みが出たら、その運動はやめましょう。痛みが強いときや、なかなか引かないときは、医療機関に相談してください。</p>
      )}
      <div className="stack">
        {easier && (
          <button type="button" className="btn btn-secondary btn-block" onClick={() => switchTo(easier)}>
            楽な「{easier.name}」に変える
          </button>
        )}
        {exercise.area !== 'recovery' && (
          <button type="button" className="btn btn-secondary btn-block" onClick={() => switchTo(recovery)}>
            回復のストレッチに変える
          </button>
        )}
        {runner.elapsed >= 1 && (
          <button type="button" className="btn btn-secondary btn-block" onClick={() => finish(false, { pain: sheet === 'pain' })}>
            ここまでを記録して終わる
          </button>
        )}
        <button type="button" className="btn btn-ghost btn-block" onClick={quit}>記録せずに終わる</button>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => {
            setSheet(null);
            runner.resume();
          }}
        >
          <Icon name="play" /> つづける
        </button>
      </div>
    </Sheet>
  );

  if (runner.phase === 'ready') {
    return (
      <main className="screen workout">
        <header className="topbar">
          <a className="back" href="#/"><Icon name="chevron-left" />今日へ</a>
        </header>
        {isFirst && <p className="note">最初の1分です。ゆっくりで大丈夫。できるところまでで、十分です。</p>}
        <p className="tags">
          <span className="tag">{AREA_LABEL[exercise.area]}</span>
          {exercise.area !== 'recovery' && <span className="tag tag-outline">レベル{exercise.level}</span>}
          {light && <span className="tag tag-soft">いつもより軽め</span>}
        </p>
        <h1>{exercise.name}</h1>
        <p className="muted">{exercise.summary}</p>
        <div className="figure-box"><PreviewFigure exercise={exercise} className="figure-lg" /></div>
        <section className="card" aria-labelledby="points-title">
          <h2 id="points-title">ポイント</h2>
          <ol className="points">
            {exercise.points.map((p) => <li key={p}>{p}</li>)}
          </ol>
        </section>
        <div className="caution">
          <Icon name="alert" />
          <div>
            {exercise.caution && <p>{exercise.caution}</p>}
            <p>{COMMON_CAUTION}</p>
          </div>
        </div>
        <section className="card compact" aria-label="運動中の合図">
          <Toggle
            label="音声ガイド"
            description={
              voiceStatus === false
                ? 'この端末では日本語の音声が使えないため、効果音と画面で進めます。'
                : '「キープ」「あと10秒」などを声で伝えます。'
            }
            checked={settings.voice}
            onChange={(v) => app.updateSettings({ voice: v })}
          />
          <Toggle label="効果音" description="動きの合図を音で知らせます。" checked={settings.sound} onChange={(v) => app.updateSettings({ sound: v })} />
        </section>
        <p className="hint">
          スマホは、離れていても見える場所に置いてください。
          {!supportsWakeLock() && 'この端末では、運動中に画面が消えることがあります。'}
        </p>
        <div className="sticky-cta">
          <button type="button" className="btn btn-primary btn-xl btn-block" onClick={onStart}>
            <Icon name="play" /> はじめる
          </button>
        </div>
      </main>
    );
  }

  const first = exercise.segments[0];
  const pos = positionAt(exercise, runner.elapsed);
  const seg = pos.segment;
  const raw = seg.transitionSec ? Math.min(1, pos.inSegment / seg.transitionSec) : pos.progress;
  const skeleton =
    runner.phase === 'countdown'
      ? skeletonOf(exercise.poses[first.from])
      : interpolateSkeleton(exercise.poses[seg.from], exercise.poses[seg.to], reduced ? 1 : easeInOut(raw));
  const remaining = Math.max(0, Math.ceil(runner.total - runner.elapsed));
  const pct = Math.min(100, (runner.elapsed / runner.total) * 100);
  const holds = exercise.segments.filter((s) => s.sound === 'hold');
  const holdIndex = exercise.segments.slice(0, pos.index + 1).filter((s) => s.sound === 'hold').length;

  return (
    <main className="screen workout is-running">
      <header className="wo-top">
        <span className="wo-name">{exercise.name}</span>
        <button
          type="button"
          className="icon-btn"
          aria-label="やめる"
          onClick={() => {
            runner.pause();
            setSheet('stop');
          }}
        >
          <Icon name="close" />
        </button>
      </header>

      <div className="wo-figure">
        <FigureSvg skeleton={skeleton} prop={exercise.prop} label={`${exercise.name}の動き`} />
      </div>

      {runner.phase === 'countdown' ? (
        <div className="wo-cue" aria-live="assertive">{runner.count}</div>
      ) : (
        <div className="wo-cue" aria-hidden="true">{seg.label}</div>
      )}
      <p className="sr-only" aria-live="polite">{announce}</p>

      <div className="wo-time" role="timer" aria-label={`残り${remaining}秒`}>{mmss(remaining)}</div>
      <div className="wo-progress" role="progressbar" aria-label="経過" aria-valuemin={0} aria-valuemax={runner.total} aria-valuenow={Math.floor(runner.elapsed)}>
        <div style={{ width: `${pct}%` }} />
      </div>
      <p className="wo-sub">
        {runner.phase === 'countdown'
          ? '3秒後に始まります'
          : seg.rep && exercise.reps
            ? `${seg.rep}回目（目安 ${exercise.reps}回）`
            : seg.sound === 'hold'
              ? `キープ ${holdIndex} / ${holds.length}`
              : seg.sound === 'rest'
                ? '休けい中。次のキープの準備を'
                : ' '}
      </p>

      <div className="wo-actions">
        <button type="button" className="btn btn-secondary" onClick={() => runner.pause()} disabled={runner.phase !== 'running'}>
          <Icon name="pause" /> 一時停止
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => {
            runner.pause();
            setSheet('pain');
          }}
        >
          痛い・やめる
        </button>
      </div>

      {runner.phase === 'paused' && sheet === null && (
        <div className="wo-paused card" role="dialog" aria-labelledby="paused-title">
          <h2 id="paused-title">一時停止中</h2>
          {runner.autoPaused && <p className="muted">画面を切り替えたので、一時停止しました。</p>}
          <button type="button" className="btn btn-primary btn-xl btn-block" onClick={runner.resume}>
            <Icon name="play" /> つづける
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={() => setSheet('stop')}>やめる</button>
        </div>
      )}
      {stopSheet}
    </main>
  );
}
