import { Icon } from './Icon';

/** iPhone の Safari 向け：共有 → ホーム画面に追加 を絵で示す */
export function InstallHint({ onClose }: { onClose?: () => void }) {
  return (
    <div className="banner banner-info install" role="status">
      <Icon name="shield" />
      <div className="install-body">
        <p className="install-title">記録を消えにくくする</p>
        <p className="install-steps">
          <span className="sr-only">共有ボタンから「ホーム画面に追加」</span>
          <span className="key" aria-hidden="true"><Icon name="share" size={18} /></span>
          <Icon name="chevron-right" size={16} />
          <span className="key" aria-hidden="true"><Icon name="plus-square" size={18} />ホーム画面に追加</span>
        </p>
      </div>
      {onClose && (
        <button type="button" className="icon-btn" aria-label="閉じる" onClick={onClose}>
          <Icon name="close" />
        </button>
      )}
    </div>
  );
}
