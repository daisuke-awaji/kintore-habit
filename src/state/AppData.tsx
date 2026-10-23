import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as A from '../domain/actions';
import { logicalDate, type DateKey } from '../domain/date';
import type { AppData, Condition, Level, Session, Settings, StrengthArea } from '../domain/schema';
import { STORAGE_KEY, clearData, getBrowserStorage, loadData, saveData, type LoadStatus } from '../domain/storage';
import { createDefaultData } from '../domain/schema';

interface AppDataContextValue {
  data: AppData;
  today: DateKey;
  status: LoadStatus;
  saveFailed: boolean;
  completeOnboarding: (input: { weeklyGoal: number; anchor: string | null }) => void;
  addSession: (input: A.SessionInput) => Session;
  updateSession: (id: string, patch: Partial<Omit<Session, 'id'>>) => void;
  deleteSession: (id: string) => void;
  setRestDay: (date: DateKey, on: boolean) => void;
  setCondition: (value: Condition) => void;
  setLevel: (area: StrengthArea, level: Level) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  dismiss: (key: string) => void;
  replaceAll: (data: AppData) => void;
  resetAll: () => void;
}

const Ctx = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const storage = useMemo(() => getBrowserStorage(), []);
  const initial = useMemo(() => loadData(storage), [storage]);
  const [data, setDataState] = useState<AppData>(initial.data);
  const [status, setStatus] = useState<LoadStatus>(initial.status);
  const [saveFailed, setSaveFailed] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const dataRef = useRef(data);

  const setData = useCallback((next: AppData) => {
    dataRef.current = next;
    setDataState(next);
  }, []);
  const apply = useCallback((fn: (d: AppData) => AppData) => setData(fn(dataRef.current)), [setData]);

  // 保存
  useEffect(() => {
    if (!storage) return;
    setSaveFailed(!saveData(storage, data));
  }, [storage, data]);

  // 日付の切り替わり（1日の区切りをまたいだら今日を更新）
  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, 30_000);
    const onVisible = () => document.visibilityState === 'visible' && tick();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', tick);
    };
  }, []);

  // 別のタブで変更されたら読み直す
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !storage) return;
      const r = loadData(storage);
      if (r.status === 'ok') setData(r.data);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [storage, setData]);

  // 表示の設定
  useEffect(() => {
    const root = document.documentElement;
    if (data.settings.theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', data.settings.theme);
    root.setAttribute('data-text', data.settings.textSize);
  }, [data.settings.theme, data.settings.textSize]);

  const today = logicalDate(now, data.settings.dayBoundaryHour);

  const value = useMemo<AppDataContextValue>(
    () => ({
      data,
      today,
      status,
      saveFailed,
      completeOnboarding: (input) => apply((d) => A.completeOnboarding(d, input, today)),
      addSession: (input) => {
        const r = A.addSession(dataRef.current, input);
        setData(r.data);
        return r.session;
      },
      updateSession: (id, patch) => apply((d) => A.updateSession(d, id, patch)),
      deleteSession: (id) => apply((d) => A.deleteSession(d, id)),
      setRestDay: (date, on) => apply((d) => A.setRestDay(d, date, on)),
      setCondition: (v) => apply((d) => A.setCondition(d, today, v)),
      setLevel: (area, level) => apply((d) => A.setLevel(d, area, level)),
      updateSettings: (patch) => apply((d) => A.updateSettings(d, patch, today)),
      dismiss: (key) => apply((d) => A.dismiss(d, key)),
      replaceAll: (next) => {
        setData(next);
        setStatus('ok');
      },
      resetAll: () => {
        clearData(storage);
        setData(createDefaultData());
        setStatus(storage ? 'new' : 'unavailable');
      },
    }),
    [data, today, status, saveFailed, apply, setData, storage],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppData(): AppDataContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('AppDataProvider がありません');
  return v;
}
