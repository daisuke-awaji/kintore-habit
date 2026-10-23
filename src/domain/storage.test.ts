import { describe, expect, it } from 'vitest';
import { CORRUPT_PREFIX, STORAGE_KEY, exportData, loadData, parseImport, saveData, type StorageLike } from './storage';
import { dataWith, session } from './testdata';

class MemoryStorage implements StorageLike {
  map = new Map<string, string>();
  getItem(k: string) { return this.map.has(k) ? this.map.get(k)! : null; }
  setItem(k: string, v: string) { this.map.set(k, v); }
  removeItem(k: string) { this.map.delete(k); }
}

describe('保存と読み込み', () => {
  it('はじめては new', () => {
    const r = loadData(new MemoryStorage());
    expect(r.status).toBe('new');
    expect(r.data.onboarded).toBe(false);
  });
  it('保存したものを読み込める', () => {
    const st = new MemoryStorage();
    const d = dataWith({ sessions: [session('2026-10-20')] });
    expect(saveData(st, d)).toBe(true);
    const r = loadData(st);
    expect(r.status).toBe('ok');
    expect(r.data.sessions).toHaveLength(1);
  });
  it('足りない項目は初期値で補う', () => {
    const st = new MemoryStorage();
    const d = dataWith();
    const { dismissed: _d, condition: _c, ...rest } = d;
    st.setItem(STORAGE_KEY, JSON.stringify(rest));
    const r = loadData(st);
    expect(r.status).toBe('ok');
    expect(r.data.dismissed).toEqual([]);
    expect(r.data.condition).toBeNull();
  });
  it('壊れたデータは黙って消さず、退避してから新しく始める', () => {
    const st = new MemoryStorage();
    st.setItem(STORAGE_KEY, '{"version":1, broken');
    const now = new Date(2026, 9, 23, 12, 0);
    const r = loadData(st, now);
    expect(r.status).toBe('recovered');
    expect(r.backupKey).toBe(`${CORRUPT_PREFIX}${now.getTime()}`);
    expect(st.getItem(r.backupKey!)).toBe('{"version":1, broken');
  });
  it('localStorage が使えないときは unavailable', () => {
    expect(loadData(null).status).toBe('unavailable');
    const throwing: StorageLike = {
      getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, removeItem() {},
    };
    expect(loadData(throwing).status).toBe('unavailable');
    expect(saveData(throwing, dataWith())).toBe(false);
  });
});

describe('書き出しと読み込み', () => {
  it('書き出したファイルを読み込める', () => {
    const d = dataWith({ sessions: [session('2026-10-20')] });
    const r = parseImport(exportData(d));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.sessions[0].date).toBe('2026-10-20');
  });
  it('中身だけのJSONも読み込める', () => {
    expect(parseImport(JSON.stringify(dataWith())).ok).toBe(true);
  });
  it('関係ないファイルは読み込まない', () => {
    expect(parseImport('hello').ok).toBe(false);
    expect(parseImport('{"foo":1}').ok).toBe(false);
    const bad = { ...dataWith(), sessions: [{ ...session('2026-10-20'), date: '2026-13-40' }] };
    expect(parseImport(JSON.stringify(bad)).ok).toBe(false);
  });
});
