// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { STORAGE_KEY } from '../domain/storage';
import { AppDataProvider } from '../state/AppData';
import { buildScenario } from './scenarios';

const TODAY = '2026-10-23';

function mount(hash: string) {
  window.location.hash = hash;
  return render(
    <AppDataProvider>
      <App />
    </AppDataProvider>,
  );
}

async function go(hash: string) {
  await act(async () => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 23, 20, 0));
  window.scrollTo = () => undefined;
  window.matchMedia =
    window.matchMedia ??
    ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList);
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
    it(`記録あり（${s}）：今日・記録・設定・運動`, async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(buildScenario(s, TODAY)));
      const r = mount('#/');
      expect(r.container.textContent).toContain('今週');
      if (s === 'welcome') expect(r.container.textContent).toContain('おかえりなさい');
      else expect(r.container.textContent).not.toContain('おかえりなさい');
      if (s === 'rest') expect(r.container.textContent).toContain('今日は回復日');
      await go('#/log');
      expect(r.container.textContent).toContain('はじめと今');
      await go('#/settings');
      expect(r.container.textContent).toContain('目標とリズム');
      await go('#/workout?ex=plank');
      expect(r.container.textContent).toContain('プランク');
    });
  }

  it('おかえりの画面では、休んだ日数に触れない', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buildScenario('welcome', TODAY)));
    const r = mount('#/');
    expect(r.container.textContent).not.toMatch(/\d+日(ぶり|休|あい)/);
  });
});
