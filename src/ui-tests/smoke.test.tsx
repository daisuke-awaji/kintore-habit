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

  it('操作の方法を文章で説明しない（印や見た目で示す）', async () => {
    const HOWTO = /(押すと|押して|タップ|できます。|変えられます|共有ボタンから|書き出しておいて|準備を)/;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buildScenario('month', TODAY)));
    const r = mount('#/');
    for (const hash of ['#/', '#/log', '#/settings', '#/workout?ex=chair-squat']) {
      await go(hash);
      expect(r.container.textContent, hash).not.toMatch(HOWTO);
    }
  });

  it('記録：あとから直せる日だけ押せる形になる', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buildScenario('month', TODAY)));
    const r = mount('#/log');
    const editable = r.container.querySelectorAll('button.week-btn.is-editable');
    // 今日を含めて過去7日まで（今日は 2026-10-23 の金曜）
    expect(editable.length).toBe(8);
    expect(r.container.querySelectorAll('.week-btn.is-static').length).toBeGreaterThan(0);
  });

  it('今日：いちばん上に「1分はじめる」、その下に今週、体の調子はその後', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buildScenario('month', TODAY)));
    const r = mount('#/');
    const main = r.container.querySelector('main')!;
    const sections = [...main.querySelectorAll(':scope > section')].map((el) => el.getAttribute('aria-labelledby'));
    expect(sections.slice(0, 3)).toEqual(['menu-title', 'week-title', 'cond-title']);
    const first = main.querySelector(':scope > section')!;
    expect(first.textContent).toContain('1分はじめる');
    expect(main.textContent!.indexOf('1分はじめる')).toBeLessThan(main.textContent!.indexOf('体の調子'));
  });

  it('今日：体の調子を変えると、上のメニューが変わる', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buildScenario('month', TODAY)));
    const r = mount('#/');
    const sore = r.getByRole('radio', { name: /筋肉痛/ });
    await act(async () => { sore.click(); });
    const menu = r.container.querySelector('section.menu')!;
    expect(menu.classList.contains('is-updated')).toBe(true);
    expect(menu.querySelector('#menu-title')!.textContent).toMatch(/ストレッチ/);
  });
});
