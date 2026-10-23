import { useEffect, useRef, useState } from 'react';
import { ChoiceGroup, Toggle } from '../components/Controls';
import { HealthNotes } from '../components/HealthNotes';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { toKey } from '../domain/date';
import { exerciseFor } from '../domain/exercises';
import { AREA_LABEL, STRENGTH_AREAS, type AppData, type Level, type Settings as SettingsT } from '../domain/schema';
import { exportData, parseImport } from '../domain/storage';
import { isIOS, isStandalone, isStoragePersisted } from '../services/platform';
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
        <p className="hint">変えると、今週から新しい目標になります。これまでの週の達成はそのまま残ります。</p>

        <h3 className="block-title">きっかけ</h3>
        <AnchorPicker value={s.anchor} onChange={(v) => set({ anchor: v })} />

        <h3 className="block-title">1日の区切り</h3>
        <ChoiceGroup label="1日の区切り" columns={6} value={s.dayBoundaryHour} onChange={(v) => set({ dayBoundaryHour: v })}
          options={[0, 1, 2, 3, 4, 5].map((h) => ({ value: h, label: `${h}時` }))} />
        <p className="hint">この時刻より前にやった運動は、前の日の記録になります（夜ふかしや夜勤の方向け）。</p>
      </section>

      <section className="card" aria-labelledby="s-level">
        <h2 id="s-level">レベル</h2>
        {STRENGTH_AREAS.map((area) => (
          <div key={area} className="level-row">
            <h3 className="block-title">{AREA_LABEL[area]}：{exerciseFor(area, data.levels[area] as Level).name}</h3>
            <ChoiceGroup<Level> label={`${AREA_LABEL[area]}のレベル`} columns={1} value={data.levels[area] as Level}
              onChange={(v) => app.setLevel(area, v)}
              options={([1, 2, 3] as Level[]).map((lv) => ({ value: lv, label: `レベル${lv}：${exerciseFor(area, lv).name}` }))} />
          </div>
        ))}
      </section>

      <section className="card compact" aria-labelledby="s-cue">
        <h2 id="s-cue">運動中</h2>
        <Toggle label="音声ガイド" description="「キープ」「あと10秒」などを声で伝えます。" checked={s.voice} onChange={(v) => set({ voice: v })} />
        <Toggle label="効果音" description="動きの合図を音で知らせます。" checked={s.sound} onChange={(v) => set({ sound: v })} />
        <Toggle label="振動" description="対応している端末だけで動きます。" checked={s.vibration} onChange={(v) => set({ vibration: v })} />
      </section>

      <section className="card" aria-labelledby="s-view">
        <h2 id="s-view">表示</h2>
        <h3 className="block-title">文字の大きさ</h3>
        <ChoiceGroup label="文字の大きさ" columns={2} value={s.textSize} onChange={(v) => set({ textSize: v })}
          options={[{ value: 'normal', label: '標準' }, { value: 'large', label: '大きい' }]} />
        <h3 className="block-title">テーマ</h3>
        <ChoiceGroup label="テーマ" columns={3} value={s.theme} onChange={(v) => set({ theme: v })}
          options={[{ value: 'system', label: '端末と同じ' }, { value: 'light', label: 'ライト' }, { value: 'dark', label: 'ダーク' }]} />
      </section>

      <section className="card" aria-labelledby="s-data">
        <h2 id="s-data">データ</h2>
        <p>
          記録はこのブラウザの中にだけ保存されています。外部には送信していません。
          {status === 'unavailable' && <strong> いまはこのブラウザに保存できない状態です。</strong>}
        </p>
        {persisted === true && <p className="hint">このブラウザでは、記録が消えにくい設定になっています。</p>}
        {isIOS() && !isStandalone() && (
          <p className="caution">
            <Icon name="alert" />
            iPhoneのSafariでは、しばらく開かないと記録が消えることがあります。共有ボタンから「ホーム画面に追加」するか、ときどき書き出しておくと安心です。
          </p>
        )}
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
        <p>記録と設定がすべて消え、最初の画面に戻ります。元に戻すことはできません。必要なら、先に書き出しておいてください。</p>
        <div className="stack">
          <button type="button" className="btn btn-danger btn-block" onClick={() => { setSheet(null); app.resetAll(); }}>削除する</button>
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
