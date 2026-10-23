import { hrefFor } from '../router';
import { Icon, type IconName } from './Icon';

const TABS: { path: string; label: string; icon: IconName }[] = [
  { path: '/', label: '今日', icon: 'home' },
  { path: '/log', label: '記録', icon: 'list' },
  { path: '/settings', label: '設定', icon: 'gear' },
];

export function TabBar({ current }: { current: string }) {
  return (
    <nav className="tabbar" aria-label="メインメニュー">
      {TABS.map((t) => (
        <a key={t.path} href={hrefFor(t.path)} className="tab" aria-current={current === t.path ? 'page' : undefined}>
          <Icon name={t.icon} size={22} />
          <span>{t.label}</span>
        </a>
      ))}
    </nav>
  );
}
