import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { HistoryEntry, Role } from '../data/types';
import { classifyQuery } from '../data/scenarios';

interface AppState {
  role: Role;
  setRole: (r: Role) => void;
  navRail: boolean;
  toggleNav: () => void;
  history: HistoryEntry[];
  /** Выполняет запрос: подбирает ответ, сохраняет в историю, возвращает запись. */
  ask: (query: string) => HistoryEntry;
  clearHistory: () => void;
}

const Ctx = createContext<AppState | null>(null);

const LS_ROLE = 'docsearch.role';
const LS_HISTORY = 'docsearch.history';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* хранилище может быть недоступно: приложение работает и без него */
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(() => read<Role>(LS_ROLE, 'user'));
  const [navRail, setNavRail] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(() => read<HistoryEntry[]>(LS_HISTORY, []));

  useEffect(() => write(LS_ROLE, role), [role]);
  useEffect(() => write(LS_HISTORY, history), [history]);

  const ask = useCallback((query: string) => {
    const entry: HistoryEntry = {
      id: Math.random().toString(36).slice(2, 10),
      query: query.trim(),
      scenario: classifyQuery(query),
      at: Date.now(),
    };
    setHistory((h) => [entry, ...h]);
    return entry;
  }, []);

  const value = useMemo<AppState>(
    () => ({
      role,
      setRole,
      navRail,
      toggleNav: () => setNavRail((v) => !v),
      history,
      ask,
      clearHistory: () => setHistory([]),
    }),
    [role, navRail, history, ask],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp должен вызываться внутри AppProvider');
  return v;
}
