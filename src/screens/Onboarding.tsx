import { useState } from 'react';
import { ChoiceGroup, LevelMeter } from '../components/Controls';
import { StaticFigure } from '../components/Figure';
import { HealthNotes } from '../components/HealthNotes';
import { Icon, type IconName } from '../components/Icon';
import { exerciseFor } from '../domain/exercises';
import { navigate } from '../router';
import { useAppData } from '../state/AppData';

export const ANCHORS = ['朝起きたら', '歯みがきの後', '昼ごはんの後', '帰宅したら', 'お風呂の前', '寝る前'];

const PROMISES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'check', title: '毎日やらなくてOK', text: '目標は「週◯回」。休む日も計画のうちです。' },
  { icon: 'play', title: '1回1分', text: '跳ばない・道具なし。集合住宅でも静かにできます。' },
  { icon: 'heart', title: '登録なし', text: '記録はこの端末の中にだけ保存されます。' },
];

/** きっかけを選ぶ。startUnselected のときは、最初はどれも選ばれていない状態にする（「決めない」を初期値にしない） */
/** 「きっかけ → 1分」の流れを絵で示す */
export function AnchorChain({ anchor }: { anchor: string }) {
  return (
    <p className="anchor-chain" aria-label={`${anchor}、1分筋トレ`}>
      <span className="chain-step" aria-hidden="true"><Icon name="clock" size={18} />{anchor}</span>
      <Icon name="arrow-right" size={18} />
      <span className="chain-step is-go" aria-hidden="true"><Icon name="play" size={16} />1分</span>
    </p>
  );
}

export function AnchorPicker({
  value, onChange, startUnselected = false,
}: { value: string | null; onChange: (v: string | null) => void; startUnselected?: boolean }) {
  const isPreset = value !== null && ANCHORS.includes(value);
  const [mode, setMode] = useState<'unset' | 'preset' | 'custom' | 'none'>(
    value === null ? (startUnselected ? 'unset' : 'none') : isPreset ? 'preset' : 'custom',
  );
  const [custom, setCustom] = useState(!isPreset && value ? value : '');
  const selected = mode === 'unset' ? null : mode === 'none' ? '__none' : mode === 'custom' ? '__custom' : value;
  return (
    <>
      <ChoiceGroup
        label="きっかけ"
        columns={2}
        value={selected}
        onChange={(v) => {
          if (v === '__none') {
            setMode('none');
            onChange(null);
          } else if (v === '__custom') {
            setMode('custom');
            onChange(custom.trim() || null);
          } else {
            setMode('preset');
            onChange(v);
          }
        }}
        options={[
          ...ANCHORS.map((a) => ({ value: a, label: a })),
          { value: '__custom', label: '自分で書く' },
          { value: '__none', label: '決めない' },
        ]}
      />
      {mode === 'custom' && (
        <label className="field">
          <span className="field-label">きっかけ（20文字まで）</span>
          <input
            className="input"
            maxLength={20}
            value={custom}
            placeholder="例：コーヒーを入れたら"
            onChange={(e) => {
              setCustom(e.target.value);
              onChange(e.target.value.trim() || null);
            }}
          />
        </label>
      )}
      {value && <AnchorChain anchor={value} />}
    </>
  );
}

export function Onboarding() {
  const { completeOnboarding } = useAppData();
  const [step, setStep] = useState(0);
  const [read, setRead] = useState(false);
  const [goal, setGoal] = useState(2);
  const [anchor, setAnchor] = useState<string | null>(null);

  const finish = (startNow: boolean) => {
    completeOnboarding({ weeklyGoal: goal, anchor });
    if (startNow) navigate('/workout', { ex: exerciseFor('lower', 1).id, first: 1 }, { replace: true });
    else navigate('/', undefined, { replace: true });
  };

  return (
    <main className="screen onboarding">
      <p className="steps" aria-label={`3ステップ中の${step + 1}つめ`}>
        {[0, 1, 2].map((i) => (
          <span key={i} className={`step-dot${i === step ? ' is-on' : ''}`} aria-hidden="true" />
        ))}
      </p>

      {step === 0 && (
        <>
          <div className="ob-hero">
            <div className="ob-mark" aria-hidden="true"><Icon name="check" size={40} strokeWidth={3} /></div>
            <h1>1分筋トレ</h1>
            <p className="lead">毎日じゃなくていい。<br />週2〜3回、1分から。</p>
          </div>
          <ul className="promises">
            {PROMISES.map((p) => (
              <li key={p.title} className="promise">
                <span className="promise-icon" aria-hidden="true"><Icon name={p.icon} /></span>
                <span>
                  <strong>{p.title}</strong>
                  <br />
                  <span className="muted">{p.text}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="sticky-cta">
            <button type="button" className="btn btn-primary btn-xl btn-block" onClick={() => setStep(1)}>はじめる</button>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <h1>始める前に</h1>
          <section className="card"><HealthNotes /></section>
          <label className={`check${read ? ' is-on' : ''}`}>
            <input type="checkbox" checked={read} onChange={(e) => setRead(e.target.checked)} />
            読みました
          </label>
          <div className="sticky-cta">
            <button type="button" className="btn btn-primary btn-xl btn-block" disabled={!read} onClick={() => setStep(2)}>次へ</button>
            <button type="button" className="btn btn-ghost btn-block" onClick={() => setStep(0)}>戻る</button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h1>週に何回やりますか？</h1>
          <div className="goal-pick">
            <ChoiceGroup
              label="週の目標"
              columns={4}
              value={goal}
              onChange={setGoal}
              options={[1, 2, 3, 4].map((n) => ({ value: n, label: `${n}回` }))}
            />
            <p className="goal-guide"><span>国の目安 週2〜3日</span></p>
          </div>

          <h2>いつやりますか？</h2>
          <AnchorPicker value={anchor} onChange={setAnchor} startUnselected />

          <section className="first-menu" aria-label="最初のメニュー">
            <StaticFigure exercise={exerciseFor('lower', 1)} className="figure-thumb" />
            <span className="first-menu-text">
              <span className="first-menu-name">{exerciseFor('lower', 1).name}</span>
              <LevelMeter level={1} size="sm" showLabel />
            </span>
          </section>
          <div className="sticky-cta">
            <button type="button" className="btn btn-primary btn-xl btn-block" onClick={() => finish(true)}>
              <Icon name="play" /> 最初の1分をやってみる
            </button>
            <button type="button" className="btn btn-ghost btn-block" onClick={() => finish(false)}>あとでやる</button>
          </div>
        </>
      )}
    </main>
  );
}
