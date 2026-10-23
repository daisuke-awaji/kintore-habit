import { useState } from 'react';
import { Stat } from '../components/Controls';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { WeekStrip } from '../components/WeekStrip';
import { formatDateJa, formatWeekRange, type DateKey } from '../domain/date';
import { exerciseFor, getExercise } from '../domain/exercises';
import { AREA_LABEL, STRENGTH_AREAS, type Level, type Session } from '../domain/schema';
import {
  achievedWeekCount, canEditDay, firstLevels, goalForWeek, isRestDay, isWeekAchieved, sessionsOn, totalDays, totalMinutes,
  weekCount, weeksSinceStart,
} from '../domain/stats';
import { useAppData } from '../state/AppData';

function sessionTitle(s: Session): string {
  if (s.kind === 'other') return 'ほかの運動';
  if (s.kind === 'recovery') return '回復のストレッチ';
  const ex = s.exerciseId ? getExercise(s.exerciseId) : undefined;
  return ex ? `1分筋トレ（${ex.name}）` : '1分筋トレ';
}

function sessionMeta(s: Session): string {
  const parts: string[] = [];
  if (s.backfilled) parts.push('あとから記録');
  else parts.push(new Date(s.at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }));
  if (!s.completed && s.durationSec > 0) parts.push(`${s.durationSec}秒で終了`);
  if (s.stoppedForPain) parts.push('痛みで中止');
  return parts.join('・');
}

function DaySheet({ date, onClose }: { date: DateKey; onClose: () => void }) {
  const app = useAppData();
  const { data, today } = app;
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const items = sessionsOn(data, date);
  const add = (kind: Session['kind']) =>
    app.addSession({
      date,
      kind,
      area: kind === 'recovery' ? 'recovery' : undefined,
      exerciseId: kind === 'recovery' ? 'stretch' : undefined,
      durationSec: kind === 'other' ? 0 : 60,
      completed: true,
      backfilled: date !== today ? true : undefined,
    });
  return (
    <Sheet open title={formatDateJa(date)} onClose={onClose}>
      {items.length === 0 ? (
        <p className="muted">この日の記録はありません。</p>
      ) : (
        <ul className="entries">
          {items.map((s) => (
            <li key={s.id} className="entry">
              <span>
                <span className="entry-title">{sessionTitle(s)}</span>
                <span className="entry-meta">{sessionMeta(s)}</span>
              </span>
              {confirmId === s.id ? (
                <button type="button" className="btn btn-danger btn-sm" onClick={() => { app.deleteSession(s.id); setConfirmId(null); }}>
                  削除する
                </button>
              ) : (
                <button type="button" className="btn btn-secondary btn-sm" aria-label={`${sessionTitle(s)}を削除`} onClick={() => setConfirmId(s.id)}>
                  <Icon name="trash" size={18} /> 削除
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <h3 className="block-title">記録を追加する</h3>
      <div className="stack">
        <button type="button" className="btn btn-secondary btn-block" onClick={() => add('workout')}><Icon name="plus" /> 1分筋トレをやった</button>
        <button type="button" className="btn btn-secondary btn-block" onClick={() => add('recovery')}><Icon name="plus" /> ストレッチをやった</button>
        <button type="button" className="btn btn-secondary btn-block" onClick={() => add('other')}><Icon name="plus" /> ほかの運動をした（散歩・ジムなど）</button>
        {date === today && items.length === 0 && (
          <button type="button" className="btn btn-ghost btn-block" onClick={() => app.setRestDay(date, !isRestDay(data, date))}>
            {isRestDay(data, date) ? '回復日の印を外す' : '今日を回復日にする'}
          </button>
        )}
      </div>
    </Sheet>
  );
}

export function Log() {
  const { data, today } = useAppData();
  const [day, setDay] = useState<DateKey | null>(null);
  const weeks = weeksSinceStart(data, today);
  const first = firstLevels(data);

  return (
    <main className="screen log">
      <h1>記録</h1>
      <section className="stats" aria-label="これまでの記録">
        <Stat label="通算" value={totalDays(data)} unit="回" />
        <Stat label="達成した週" value={achievedWeekCount(data)} unit="週" />
        <Stat label="合計" value={totalMinutes(data)} unit="分" />
      </section>

      <section className="card" aria-labelledby="growth-title">
        <h2 id="growth-title">はじめと今</h2>
        <ul className="growth">
          {STRENGTH_AREAS.map((area) => {
            const from = first[area] as Level | undefined;
            const now = data.levels[area] as Level;
            return (
              <li key={area}>
                <span className="growth-area">{AREA_LABEL[area]}</span>
                {from === undefined ? (
                  <span className="muted">まだやっていません</span>
                ) : from === now ? (
                  <span>{exerciseFor(area, now).name}<span className="muted">（はじめと同じ）</span></span>
                ) : (
                  <span>
                    {exerciseFor(area, from).name} <span aria-label="から">→</span> <strong>{exerciseFor(area, now).name}</strong>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <p className="hint">1日に何回やっても1回と数えます。日付を押すと、7日前までの記録を追加・削除できます。</p>

      {weeks.map((ws) => {
        const count = weekCount(data, ws);
        const goal = goalForWeek(data, ws);
        const achieved = isWeekAchieved(data, ws) && count > 0;
        return (
          <section key={ws} className="card week-card" aria-label={`${formatWeekRange(ws)}の記録`}>
            <div className="week-head">
              <h2 className="week-range">{formatWeekRange(ws)}</h2>
              <span className={`badge${achieved ? ' badge-ok' : ''}`}>
                {achieved && <Icon name="check" size={14} strokeWidth={3} />}
                {count} / {goal}回{achieved ? ' 達成' : ''}
              </span>
            </div>
            <WeekStrip data={data} weekStartKey={ws} today={today} size="sm" canPress={(d) => canEditDay(data, d, today)} onPress={setDay} />
          </section>
        );
      })}

      {day && <DaySheet date={day} onClose={() => setDay(null)} />}
    </main>
  );
}
