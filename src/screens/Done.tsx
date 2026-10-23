import { useState } from 'react';
import { ChoiceGroup } from '../components/Controls';
import { Icon } from '../components/Icon';
import { WeekStrip } from '../components/WeekStrip';
import { weekStart } from '../domain/date';
import { exerciseFor, getExercise } from '../domain/exercises';
import { levelProposal, suggestMenu, type LevelProposal } from '../domain/menu';
import { FEELING_LABEL, type Feeling } from '../domain/schema';
import { goalForWeek, minutesOn, sessionsOn, totalDays, weekCount } from '../domain/stats';
import { hrefFor, navigate } from '../router';
import { isIOS, isStandalone } from '../services/platform';
import { useAppData } from '../state/AppData';
import { weekMessage } from './Home';

export function Done({ params }: { params: URLSearchParams }) {
  const app = useAppData();
  const { data, today } = app;
  const id = params.get('id');
  const session = data.sessions.find((s) => s.id === id);
  const [decision, setDecision] = useState<{ kind: 'accepted'; proposal: LevelProposal } | { kind: 'kept' } | null>(null);

  if (!session) {
    return (
      <main className="screen">
        <h1>記録が見つかりませんでした</h1>
        <a className="btn btn-primary btn-block" href={hrefFor('/')}>今日へ</a>
      </main>
    );
  }

  const ws = weekStart(session.date);
  const count = weekCount(data, ws);
  const goal = goalForWeek(data, ws);
  const firstEver = data.sessions.length === 1;
  const firstOfDay = sessionsOn(data, session.date)[0]?.id === session.id;
  const ex = session.exerciseId ? getExercise(session.exerciseId) : undefined;
  const proposal = levelProposal(data, session);
  const next = getExercise(suggestMenu(data, today).exerciseId)!;
  const askFeeling = !session.stoppedForPain && session.kind !== 'other';

  const subtitle = firstEver
    ? '最初の1分、おつかれさまでした。次は2〜3日のうちに、もう1回やってみましょう。'
    : firstOfDay
      ? `通算${totalDays(data)}回目です。`
      : `今日は${minutesOn(data, session.date)}分できました。`;

  return (
    <main className="screen done">
      <div className={`stamp${session.completed ? '' : ' is-partial'}`} aria-hidden="true">
        <Icon name="check" size={56} strokeWidth={3} />
      </div>
      <h1 className="center">{session.completed ? '今日のぶん、できた' : 'ここまで、おつかれさまでした'}</h1>
      <p className="center muted">{subtitle}</p>

      {session.stoppedForPain && (
        <p className="caution">
          <Icon name="alert" />
          痛みがあるときは、無理せず休みましょう。痛みが強いときや、なかなか引かないときは、医療機関に相談してください。
        </p>
      )}

      <section className="card" aria-labelledby="done-week">
        <div className="week-head">
          <h2 id="done-week">今週</h2>
          <p className="week-count"><strong>{count}</strong> / {goal}回</p>
        </div>
        <WeekStrip data={data} weekStartKey={ws} today={today} size="sm" />
        <p className="week-msg">{count === goal && firstOfDay ? '今週の目標を達成しました！' : weekMessage(count, goal)}</p>
      </section>

      {askFeeling && (
        <section className="card" aria-labelledby="feel-title">
          <h2 id="feel-title">きつさはどうでしたか？</h2>
          <ChoiceGroup<Feeling>
            label="きつさ"
            columns={3}
            value={session.feeling ?? null}
            onChange={(v) => {
              app.updateSession(session.id, { feeling: v });
              setDecision(null);
            }}
            options={(['hard', 'ok', 'easy'] as Feeling[]).map((f) => ({ value: f, label: FEELING_LABEL[f] }))}
          />
          {session.feeling === 'ok' && <p className="note">ちょうどいいですね。このまま続けましょう。</p>}
          {session.feeling === 'easy' && !proposal && ex && ex.area !== 'recovery' && ex.level === 3 && (
            <p className="note">いちばん上のレベルです。物足りない日は「もう1分」もできます。</p>
          )}
          {proposal && decision === null && (
            <div className="proposal">
              <p>
                {proposal.direction === 'up' ? '次から' : '次からは'}「{exerciseFor(proposal.area, proposal.to).name}」
                {proposal.direction === 'up' ? 'にレベルを上げますか？' : 'にしますか？'}
              </p>
              <div className="row-buttons">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    app.setLevel(proposal.area, proposal.to);
                    setDecision({ kind: 'accepted', proposal });
                  }}
                >
                  {proposal.direction === 'up' ? '上げる' : 'そうする'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setDecision({ kind: 'kept' })}>このまま</button>
              </div>
            </div>
          )}
          {decision?.kind === 'accepted' && (
            <p className="note">
              次から「{exerciseFor(decision.proposal.area, decision.proposal.to).name}」にします。レベルは設定からいつでも変えられます。
            </p>
          )}
          {decision?.kind === 'kept' && <p className="note">このまま続けましょう。</p>}
        </section>
      )}

      {firstEver && isIOS() && !isStandalone() && (
        <div className="banner banner-info" role="status">
          <Icon name="info" />
          <p>iPhoneのSafariでは、しばらく開かないと記録が消えることがあります。共有ボタンから「ホーム画面に追加」しておくと安心です。</p>
        </div>
      )}

      <div className="stack">
        <button type="button" className="btn btn-primary btn-xl btn-block" onClick={() => navigate('/', undefined, { replace: true })}>
          今日へ
        </button>
        <button type="button" className="btn btn-secondary btn-block" onClick={() => navigate('/workout', { ex: next.id }, { replace: true })}>
          もう1分やる（{next.name}）
        </button>
      </div>
    </main>
  );
}
