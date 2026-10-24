import { useEffect, useRef, useState } from 'react';
import { ChoiceGroup, LevelMeter, Toggle } from '../components/Controls';
import { StaticFigure } from '../components/Figure';
import { HealthNotes } from '../components/HealthNotes';
import { InstallHint } from '../components/InstallHint';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { toKey } from '../domain/date';
import { exerciseFor } from '../domain/exercises';
import { AREA_LABEL, STRENGTH_AREAS, type AppData, type Level, type Settings as SettingsT } from '../domain/schema';
import { exportData, parseImport } from '../domain/storage';
import { sampleCue } from '../services/feedback';
import { isIOS, isStandalone, isStoragePersisted, supportsVibration } from '../services/platform';
import { useAppData } from '../state/AppData';
import { AnchorPicker } from './Onboarding';

export const APP_VERSION = '1.0.0';
const REPO_URL = 'https://github.com/daisuke-awaji/kintore-habit';

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 1日の区切りを、夜から朝の帯で見せる（区切りより前は前の日の色） */
export function DayBoundary({ hour }: { hour: number }) {
  // 21時〜翌7時の10時間を帯にする
  const startH = 21;
  const span = 10;
  const pos = ((24 - startH + hour) / span) * 100;
  return (
    <div className="boundary" role="img" aria-label={`${hour}時より前は前の日の記録`}>
      <div className="boundary-bar">
        <span className="boundary-prev" style={{ width: `${pos}%` }}>前の日</span>
        <span className="boundary-next">次の日</span>
        <span className="boundary-cut" style={{ left: `${pos}%` }} />
      </div>
      <div className="boundary-ticks" aria-hidden="true">
        {[21, 0, 3, 6].filter((h) => h !== hour && Math.abs(((h - startH + 24) % 24) - ((hour - startH + 24) % 24)) > 1).map((h) => (
          <span key={h} style={{ left: `${(((h - startH + 24) % 24) / span) * 100}%` }}>{h}時</span>
        ))}
        <span className="is-cut" style={{ left: `${pos}%` }}>{hour}時</span>
      </div>
    </div>
  );
}

export function Settings() {
  const app = useAppData();
  const { data, status } = app;
  const s = data.settings;
  const set = (patch: Partial<SettingsT>) => app.updateSettings(patch);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [sheet, setSheet] = useState<null | 'health' | 'delete' | 'import'>(null);
  const [pending, setPending] = useState<AppData | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void isStoragePersisted().then(setPersisted);
  }, []);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const r = parseImport(await file.text());
    if (fileRef.current) fileRef.current.value = '';
    if (!r.ok) {
      setMessage(r.error);
      return;
    }
    setPending(r.data);
    setSheet('import');
  };

  return (
    <main className="screen settings">
      <h1>設定</h1>
      {message && (
        <div className="banner" role="status">
          <Icon name="info" />
          <p>{message}</p>
          <button type="button" className="icon-btn" aria-label="閉じる" onClick={() => setMessage(null)}><Icon name="close" /></button>
        </div>
      )}

      <section className="card" aria-labelledby="s-goal">
        <h2 id="s-goal">目標とリズム</h2>
        <h3 className="block-title">週の目標</h3>
        <ChoiceGroup label="週の目標" columns={4} value={s.weeklyGoal} onChange={(v) => set({ weeklyGoal: v })}
          options={[1, 2, 3, 4].map((n) => ({ value: n, label: `${n}回` }))} />

        <h3 className="block-title">きっかけ</h3>
        <AnchorPicker value={s.anchor} onChange={(v) => set({ anchor: v })} />

        <h3 className="block-title">1日の区切り</h3>
        <ChoiceGroup label="1日の区切り" columns={6} value={s.dayBoundaryHour} onChange={(v) => set({ dayBoundaryHour: v })}
          options={[0, 1, 2, 3, 4, 5].map((h) => ({ value: h, label: `${h}時` }))} />
        <DayBoundary hour={s.dayBoundaryHour} />
      </section>

      <section className="card" aria-labelledby="s-level">
        <h2 id="s-level">レベル</h2>
        {STRENGTH_AREAS.map((area) => (
          <div key={area} className="level-row">
            <h3 className="block-title">{AREA_LABEL[area]}</h3>
            <ChoiceGroup<Level> label={`${AREA_LABEL[area]}のレベル`} columns={3} variant="tile" value={data.levels[area] as Level}
              onChange={(v) => app.setLevel(area, v)}
              options={([1, 2, 3] as Level[]).map((lv) => ({
                value: lv,
                name: `レベル${lv}：${exerciseFor(area, lv).name}`,
                label: (
                  <>
                    <StaticFigure exercise={exerciseFor(area, lv)} className="figure-thumb" />
                    <LevelMeter level={lv} size="sm" />
                    <span className="tile-label">{exerciseFor(area, lv).name}</span>
                  </>
                ),
              }))} />
          </div>
        ))}
      </section>

      <section className="card compact" aria-labelledby="s-cue">
        <h2 id="s-cue">運動中</h2>
        <Toggle label="音声ガイド" icon="voice" checked={s.voice} onChange={(v) => { set({ voice: v }); if (v) sampleCue('voice'); }} />
        <Toggle label="効果音" icon="note" checked={s.sound} onChange={(v) => { set({ sound: v }); if (v) sampleCue('sound'); }} />
        <Toggle label="振動" icon="vibrate" disabled={!supportsVibration()} checked={s.vibration}
          onChange={(v) => { set({ vibration: v }); if (v) sampleCue('vibration'); }} />
      </section>

      <section className="card" aria-labelledby="s-view">
        <h2 id="s-view">表示</h2>
        <h3 className="block-title">文字の大きさ</h3>
        <ChoiceGroup label="文字の大きさ" columns={2} value={s.textSize} onChange={(v) => set({ textSize: v })}
          options={[
            { value: 'normal', name: '標準', label: <span className="text-sample is-normal">あA<small>標準</small></span> },
            { value: 'large', name: '大きい', label: <span className="text-sample is-large">あA<small>大きい</small></span> },
          ]} />
        <h3 className="block-title">テーマ</h3>
        <ChoiceGroup label="テーマ" columns={3} value={s.theme} onChange={(v) => set({ theme: v })}
          variant="tile"
          options={[
            { value: 'system', name: '端末と同じ', label: <><span className="theme-swatch is-system" aria-hidden="true" /><span className="tile-label">端末と同じ</span></> },
            { value: 'light', name: 'ライト', label: <><span className="theme-swatch is-light" aria-hidden="true" /><span className="tile-label">ライト</span></> },
            { value: 'dark', name: 'ダーク', label: <><span className="theme-swatch is-dark" aria-hidden="true" /><span className="tile-label">ダーク</span></> },
          ]} />
      </section>

      <section className="card" aria-labelledby="s-data">
        <h2 id="s-data">データ</h2>
        <p className="privacy"><Icon name="lock" size={18} />記録はこのブラウザの中だけ。外部には送信しません。</p>
        {status === 'unavailable' && <p className="chip-warn"><Icon name="alert" size={16} />いまはこのブラウザに保存できません</p>}
        {persisted === true && <p className="chip-ok"><Icon name="shield" size={16} />消えにくい保存</p>}
        {isIOS() && !isStandalone() && <InstallHint />}
        <div className="stack">
          <button type="button" className="btn btn-secondary btn-block"
            onClick={() => download(`kintore-habit-${toKey(new Date())}.json`, exportData(data))}>
            <Icon name="download" /> 記録を書き出す（バックアップ）
          </button>
          <button type="button" className="btn btn-secondary btn-block" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" /> 書き出したファイルを読み込む
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
          <button type="button" className="btn btn-danger btn-block" onClick={() => setSheet('delete')}>
            <Icon name="trash" /> すべての記録を削除
          </button>
        </div>
      </section>

      <section className="card compact" aria-labelledby="s-about">
        <h2 id="s-about">このアプリについて</h2>
        <button type="button" className="row" onClick={() => setSheet('health')}>
          <span className="row-label">体についての注意</span><Icon name="chevron-right" />
        </button>
        <a className="row" href={REPO_URL} target="_blank" rel="noopener noreferrer">
          <span className="row-label">ソースコードと計画（GitHub）</span><Icon name="chevron-right" />
        </a>
        <p className="row-desc">バージョン {APP_VERSION}・MIT License</p>
      </section>

      <Sheet open={sheet === 'health'} title="体についての注意" onClose={() => setSheet(null)}>
        <HealthNotes />
      </Sheet>

      <Sheet open={sheet === 'delete'} title="すべての記録を削除しますか？" onClose={() => setSheet(null)}>
        <p>記録と設定がすべて消え、最初の画面に戻ります。元に戻すことはできません。</p>
        <div className="stack">
          <button type="button" className="btn btn-secondary btn-block"
            onClick={() => download(`kintore-habit-${toKey(new Date())}.json`, exportData(data))}>
            <Icon name="download" /> 先に書き出す
          </button>
          <button type="button" className="btn btn-danger btn-block" onClick={() => { setSheet(null); app.resetAll(); }}>
            <Icon name="trash" /> 削除する
          </button>
          <button type="button" className="btn btn-secondary btn-block" onClick={() => setSheet(null)}>やめる</button>
        </div>
      </Sheet>

      <Sheet open={sheet === 'import' && !!pending} title="記録を読み込みますか？" onClose={() => { setSheet(null); setPending(null); }}>
        <p>いまの記録は、ファイルの内容に置き換わります（記録 {pending?.sessions.length ?? 0}件）。</p>
        <div className="stack">
          <button type="button" className="btn btn-primary btn-block"
            onClick={() => { if (pending) app.replaceAll(pending); setPending(null); setSheet(null); setMessage('記録を読み込みました。'); }}>
            読み込む
          </button>
          <button type="button" className="btn btn-secondary btn-block" onClick={() => { setPending(null); setSheet(null); }}>やめる</button>
        </div>
      </Sheet>
    </main>
  );
}
