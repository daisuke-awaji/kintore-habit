import { useEffect } from 'react';

/** active の間、画面が自動で消えないようにする（対応しているブラウザのみ） */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let disposed = false;
    const request = async () => {
      try {
        if (document.visibilityState !== 'visible') return;
        const s = await navigator.wakeLock.request('screen');
        if (disposed) void s.release();
        else sentinel = s;
      } catch {
        // 省電力モードなどで断られることがある
      }
    };
    void request();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void request();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', onVisible);
      void sentinel?.release().catch(() => undefined);
    };
  }, [active]);
}
