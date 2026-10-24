import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface Option<T extends string | number> {
  value: T;
  label: ReactNode;
  /** 読み上げ用の名前（label が絵などのとき） */
  name?: string;
  /** 右上に付ける小さな印（「おすすめ」など） */
  badge?: string;
}

/** 1つだけ選ぶボタンの並び。tile は絵を上に置く大きめの形 */
export function ChoiceGroup<T extends string | number>({
  label, options, value, onChange, columns, variant = 'pill',
}: {
  label: string;
  options: Option<T>[];
  value: T | null;
  onChange: (v: T) => void;
  columns?: number;
  variant?: 'pill' | 'tile';
}) {
  return (
    <div
      className={`choices choices-${variant}`}
      role="radiogroup"
      aria-label={label}
      style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
    >
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.name}
            className={`choice${on ? ' is-on' : ''}`}
            onClick={() => onChange(o.value)}
          >
            {o.badge && <span className="choice-badge">{o.badge}</span>}
            {on && variant === 'pill' && <Icon name="check" size={16} strokeWidth={3} />}
            {on && variant === 'tile' && (
              <span className="choice-check" aria-hidden="true"><Icon name="check" size={14} strokeWidth={3.5} /></span>
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** オン・オフ。アイコンで何の設定かを示す。使えない端末では押せない見た目にする */
export function Toggle({
  label, icon, checked, onChange, disabled = false,
}: { label: string; icon?: IconName; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  const on = checked && !disabled;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      className={`row toggle-row${disabled ? ' is-disabled' : ''}`}
      onClick={() => onChange(!checked)}
    >
      {icon && (
        <span className={`row-icon${on ? ' is-on' : ''}`} aria-hidden="true">
          <Icon name={disabled && icon === 'voice' ? 'volume-off' : icon} />
        </span>
      )}
      <span className="row-label">{label}</span>
      <span className={`switch${on ? ' is-on' : ''}`} aria-hidden="true">
        <span className="switch-knob" />
      </span>
    </button>
  );
}

export function Stat({ label, value, unit }: { label: string; value: ReactNode; unit?: string }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
    </div>
  );
}

/** レベルを3本の棒で示す（1〜3） */
export function LevelMeter({
  level, max = 3, size = 'md', showLabel = false,
}: { level: number; max?: number; size?: 'sm' | 'md'; showLabel?: boolean }) {
  const bars = (
    <span className={`meter meter-${size}`} role="img" aria-label={`レベル${level}（${max}段階）`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`meter-bar${i < level ? ' is-on' : ''}`} style={{ height: `${40 + (i * 60) / (max - 1)}%` }} />
      ))}
    </span>
  );
  if (!showLabel) return bars;
  return (
    <span className="meter-with-label">
      <span aria-hidden="true">レベル{level}</span>
      {bars}
    </span>
  );
}

/** 何回目かを点で示す。done までは塗り、current は今の点 */
export function Dots({ total, current, label }: { total: number; current: number; label: string }) {
  return (
    <span className={`dots${total <= 5 ? ' dots-lg' : ''}`} role="img" aria-label={label}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`dot${i + 1 < current ? ' is-done' : i + 1 === current ? ' is-now' : ''}`} />
      ))}
    </span>
  );
}
