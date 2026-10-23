import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

/** 下から出るシート（ネイティブの dialog を使う：フォーカスの閉じ込めと Esc に対応） */
export function Sheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby="sheet-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open && (
        <div className="sheet-body">
          <div className="sheet-head">
            <h2 id="sheet-title">{title}</h2>
            <button type="button" className="icon-btn" aria-label="閉じる" onClick={onClose}>
              <Icon name="close" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
