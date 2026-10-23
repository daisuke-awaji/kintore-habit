// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { AppDataProvider } from '../state/AppData';

function mount(hash: string) {
  window.location.hash = hash;
  return render(
    <AppDataProvider>
      <App />
    </AppDataProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 23, 20, 0));
  window.matchMedia = window.matchMedia ?? ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList);
  HTMLDialogElement.prototype.showModal = HTMLDialogElement.prototype.showModal ?? function (this: HTMLDialogElement) { this.open = true; };
  HTMLDialogElement.prototype.close = HTMLDialogElement.prototype.close ?? function (this: HTMLDialogElement) { this.open = false; };
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('画面が表示できる（落ちない）', () => {
  it('はじめての人には、はじめにの画面', () => {
    const r = mount('#/');
    expect(r.getByText('1分筋トレ')).toBeTruthy();
  });

  for (const s of ['month', 'welcome', 'rest']) {
    it(`記録あり（${s}）：今日・記録・設定`, async () => {
      const r = mount(`#/dev/seed?s=${s}`);
      await act(async () => {});
      expect(r.container.textContent).toContain('今週');
      if (s === 'welcome') expect(r.container.textContent).toContain('おかえりなさい');
      if (s === 'rest') expect(r.container.textContent).toContain('今日は回復日');
      await act(async () => { window.location.hash = '#/log'; window.dispatchEvent(new HashChangeEvent('hashchange')); });
      expect(r.container.textContent).toContain('はじめと今');
      await act(async () => { window.location.hash = '#/settings'; window.dispatchEvent(new HashChangeEvent('hashchange')); });
      expect(r.container.textContent).toContain('目標とリズム');
      await act(async () => { window.location.hash = '#/workout?ex=plank'; window.dispatchEvent(new HashChangeEvent('hashchange')); });
      expect(r.container.textContent).toContain('プランク');
    });
  }
});
