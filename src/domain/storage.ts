import { appDataSchema, createDefaultData, type AppData } from './schema';

export const STORAGE_KEY = 'kintore-habit:v1';
export const CORRUPT_PREFIX = 'kintore-habit:corrupt:';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type LoadStatus = 'ok' | 'new' | 'recovered' | 'unavailable';

export interface LoadResult {
  data: AppData;
  status: LoadStatus;
  backupKey?: string;
}

/** ブラウザの localStorage。使えない環境（一部のプライベートブラウズなど）では null */
export function getBrowserStorage(): StorageLike | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const probe = '__kintore_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

/** 将来データの形式を変えたときの移行処理。いまは v1 のみ */
export function migrate(raw: unknown): unknown {
  return raw;
}

export function validate(raw: unknown): AppData | null {
  const parsed = appDataSchema.safeParse(migrate(raw));
  return parsed.success ? parsed.data : null;
}

export function loadData(storage: StorageLike | null, now: Date = new Date()): LoadResult {
  if (!storage) return { data: createDefaultData(now), status: 'unavailable' };
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { data: createDefaultData(now), status: 'unavailable' };
  }
  if (raw === null) return { data: createDefaultData(now), status: 'new' };

  let parsed: unknown = undefined;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = undefined;
  }
  const data = parsed === undefined ? null : validate(parsed);
  if (data) return { data, status: 'ok' };

  // 黙って消さない：元の文字列を退避してから新しく始める
  const backupKey = `${CORRUPT_PREFIX}${now.getTime()}`;
  try {
    storage.setItem(backupKey, raw);
  } catch {
    // 退避できなくても、元のキーは上書きするまで残っている
  }
  return { data: createDefaultData(now), status: 'recovered', backupKey };
}

export function saveData(storage: StorageLike | null, data: AppData): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearData(storage: StorageLike | null): void {
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // 何もしない
  }
}

export const EXPORT_APP_ID = 'kintore-habit';

export function exportData(data: AppData, now: Date = new Date()): string {
  return JSON.stringify({ app: EXPORT_APP_ID, exportedAt: now.toISOString(), data }, null, 2);
}

export type ImportResult = { ok: true; data: AppData } | { ok: false; error: string };

export function parseImport(text: string): ImportResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: 'ファイルを読み込めませんでした（JSONではありません）。' };
  }
  const candidate =
    json && typeof json === 'object' && 'data' in json && (json as { app?: unknown }).app === EXPORT_APP_ID
      ? (json as { data: unknown }).data
      : json;
  const data = validate(candidate);
  if (!data) return { ok: false, error: 'このアプリの記録ファイルではないか、内容が壊れています。' };
  return { ok: true, data };
}
