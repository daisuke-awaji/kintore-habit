import type { ReactNode } from 'react';

interface Option<T extends string | number> {
  value: T;
  label: ReactNode;
}

/** 1つだけ選ぶボタンの並び */
export function ChoiceGroup<T extends string | number>({
  label, options, value, onChange, columns,
}: { label: string; options: Option<T>[]; value: T | null; onChange: (v: T) => void; columns?: number }) {
  return (
    <div className="choices" role="radiogroup" aria-label={label} style={columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : undefined}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={`choice${value === o.value ? ' is-on' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className="row toggle-row" onClick={() => onChange(!checked)}>
      <span className="row-text">
        <span className="row-label">{label}</span>
        {description && <span className="row-desc">{description}</span>}
      </span>
      <span className={`switch${checked ? ' is-on' : ''}`} aria-hidden="true">
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
