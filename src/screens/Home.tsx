import { useRef, useState } from 'react';
import { ChoiceGroup, LevelMeter, Stat } from '../components/Controls';
import { StaticFigure } from '../components/Figure';
import { Icon } from '../components/Icon';
import { InstallHint } from '../components/InstallHint';
import { WeekStrip } from '../components/WeekStrip';
import { formatDateJa, weekStart } from '../domain/date';
import { RECOVERY_ID, exerciseFor, getExercise } from '../domain/exercises';
import { conditionToday, suggestMenu } from '../domain/menu';
import { AREA_LABEL, CONDITION_LABEL, type Area, type Condition, type Level } from '../domain/schema';
import {
  achievedWeekCount, dayNumberSinceStart, goalForWeek, hasSessionOn, isRestDay, isWelcomeBack, minutesOn, totalDays, weekCount,
} from '../domain/stats';
import { navigate } from '../router';
import { isIOS, isStandalone } from '../services/platform';
import { useAppData } from '../state/AppData';

export function anchorPhrase(anchor: string): string {
  return /たら$/.test(anchor) ? `${anchor}1分` : `${anchor}に1分`;
}

export function weekMessage(count: number, goal: number): string {
  if (count >= goal) return '今週の目標を達成しました。ここからはおまけです。';
  if (count === 0) return `今週はこれから。目標は${goal}回です。`;
  return `あと${goal - count}回で今週の目標です。`;
}

export function StorageBanners() {
  const { status, saveFailed, data, dismiss } = useAppData();
  const showIOS = isIOS() && !isStandalone() && data.sessions.length > 0 && !data.dismissed.includes('ios-install');
  return (
    <>
      {status === 'unavailable' && (
        <div className="banner" role="alert">
          <Icon name="alert" />
          <p>このブラウザでは記録を保存できません（プライベートブラウズなど）。ページを閉じると記録が消えます。</p>
        </div>
      )}
      {status === 'recovered' && (
        <div className="banner" role="status">
          <Icon name="info" />
          <p>保存されていた記録を読み込めなかったため、新しく始めました。元のデータは、この端末の中に別に残してあります。</p>
        </div>
      )}
      {saveFailed && status !== 'unavailable' && (
        <div className="banner" role="alert">
          <Icon name="alert" />
          <p>記録を保存できませんでした。端末の空き容量を確認してください。</p>
        </div>
      )}
      {showIOS && <InstallHint onClose={() => dismiss('ios-install')} />}
    </>
  );
}

export function Home() {
  const app = useAppData();
  const { data, today } = app;
  const [override, setOverride] = useState<Area | undefined>(undefined);

  const ws = weekStart(today);
  const count = weekCount(data, ws);
  const goal = goalForWeek(data, ws);
  const doneToday = hasSessionOn(data, today);
  const restToday = isRestDay(data, today);
  const welcome = isWelcomeBack(data, today);
  const condition = conditionToday(data, today);
  const menu = suggestMenu(data, today, override);
  const ex = getExercise(menu.exerciseId)!;
  const start = () => navigate('/workout', { ex: ex.id, light: menu.light ? 1 : undefined });

  const menuRef = useRef<HTMLElement>(null);
  const [pulse, setPulse] = useState(0);
  // 体の調子を変えると上のメニューが変わるので、メニューを見える位置に戻して光らせる
  const changeCondition = (v: Condition) => {
    app.setCondition(v);
    setOverride(undefined);
    setPulse((n) => n + 1);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    menuRef.current?.scrollIntoView?.({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  const week = (
    <section className="card" aria-labelledby="week-title">
      <div className="week-head">
        <h2 id="week-title">今週</h2>
        <p className="week-count"><strong>{count}</strong> / {goal}回</p>
      </div>
      <WeekStrip data={data} weekStartKey={ws} today={today} />
      <p className="week-msg">{weekMessage(count, goal)}</p>
    </section>
  );

  return (
    <main className="screen home">
      <h1 className="sr-only">今日（{formatDateJa(today)}）</h1>
      <StorageBanners />

      {doneToday && (
        <section className="card hero hero-done" aria-labelledby="hero-title">
          <div className="hero-stamp" aria-hidden="true"><Icon name="check" size={32} strokeWidth={3} /></div>
          <h2 id="hero-title">今日のぶん、できた</h2>
          <p className="muted">今日は{minutesOn(data, today)}分。おつかれさまでした。</p>
          <button type="button" className="btn btn-secondary btn-block" onClick={start}>もう1分やる（おまけ）</button>
        </section>
      )}

      {!doneToday && restToday && (
        <section className="card hero" aria-labelledby="hero-title">
          <div className="hero-stamp is-rest" aria-hidden="true">休</div>
          <h2 id="hero-title">今日は回復日</h2>
          <p className="muted">休むのも計画のうち。筋肉は、休んでいる間に強くなります。</p>
          <button type="button" className="btn btn-secondary btn-block" onClick={() => app.setRestDay(today, false)}>やっぱりやる</button>
        </section>
      )}

      {!doneToday && !restToday && (
        <section
          ref={menuRef}
          key={pulse}
          className={`card menu${pulse > 0 ? ' is-updated' : ''}`}
          aria-labelledby="menu-title"
        >
          {(welcome || data.settings.anchor) && (
            <div className="menu-eyebrow">
              {welcome && <p className="menu-welcome">おかえりなさい</p>}
              {data.settings.anchor && (
                <p className="anchor"><Icon name="clock" size={16} />{anchorPhrase(data.settings.anchor)}</p>
              )}
            </div>
          )}
          <p className="tags">
            <span className="tag">{AREA_LABEL[menu.area]}</span>
            {menu.area !== 'recovery' && <span className="tag tag-outline"><LevelMeter level={menu.level} size="sm" showLabel /></span>}
            {menu.light && <span className="tag tag-soft">いつもより軽め</span>}
          </p>
          <h2 id="menu-title" className="menu-title">{ex.name}</h2>
          <p className="muted">{ex.summary}</p>
          <div className="figure-box"><StaticFigure exercise={ex} className="figure-md" /></div>
          {menu.note && <p className="note">{menu.note}</p>}
          {menu.caution && (
            <p className="caution"><Icon name="alert" />{menu.caution}</p>
          )}
          <button type="button" className="btn btn-primary btn-xl btn-block" onClick={start}>
            <Icon name="play" /> 1分はじめる
          </button>
          <div className="other">
            <p className="block-title">ほかのメニュー</p>
            <ChoiceGroup<Area>
              label="ほかのメニュー"
              variant="tile"
              columns={4}
              value={override ?? menu.area}
              onChange={setOverride}
              options={(['lower', 'upper', 'core', 'recovery'] as Area[]).map((a) => {
                const e = a === 'recovery' ? getExercise(RECOVERY_ID)! : exerciseFor(a, data.levels[a] as Level);
                return {
                  value: a,
                  name: AREA_LABEL[a],
                  label: (
                    <>
                      <StaticFigure exercise={e} className="figure-thumb" />
                      <span className="tile-label">{AREA_LABEL[a]}</span>
                    </>
                  ),
                };
              })}
            />
          </div>
        </section>
      )}

      {week}

      {!doneToday && !restToday && (
        <>
          <section className="block" aria-labelledby="cond-title">
            <h2 id="cond-title" className="block-title">体の調子</h2>
            <ChoiceGroup<Condition>
              label="体の調子"
              columns={2}
              value={condition}
              onChange={changeCondition}
              options={(['normal', 'sore', 'tired', 'pain'] as Condition[]).map((c) => ({ value: c, label: CONDITION_LABEL[c] }))}
            />
          </section>

          <button type="button" className="btn btn-secondary btn-block btn-rest" onClick={() => app.setRestDay(today, true)}>
            <span className="rest-mark" aria-hidden="true">休</span>今日は休む
          </button>
        </>
      )}

      {data.startDate && (
        <section className="stats" aria-label="これまでの記録">
          <Stat label="通算" value={totalDays(data)} unit="回" />
          <Stat label="達成した週" value={achievedWeekCount(data)} unit="週" />
          <Stat label="始めてから" value={dayNumberSinceStart(data, today)} unit="日目" />
        </section>
      )}
    </main>
  );
}
