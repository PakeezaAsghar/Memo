import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getStoredToken, setStoredToken } from '../lib/api';
import type {
  CalendarMood,
  CollectionKey,
  PageId,
  UserPreferences,
  UserProfile,
  WorkspaceData,
} from '../types/workspace';

export type QuickCaptureKind =
  | 'note'
  | 'task'
  | 'link'
  | 'idea'
  | 'journal'
  | 'document'
  | 'event'
  | 'media';

export interface ToastMessage {
  id: string;
  title: string;
  variant: 'success' | 'error' | 'info';
}

interface WorkspaceContextValue {
  user: UserProfile | null;
  workspace: WorkspaceData | null;
  loading: boolean;
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  quickCaptureOpen: QuickCaptureKind | null;
  openQuickCapture: (kind: QuickCaptureKind) => void;
  closeQuickCapture: () => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  toasts: ToastMessage[];
  notify: (title: string, variant?: ToastMessage['variant']) => void;
  dismissToast: (id: string) => void;
  refreshWorkspace: () => Promise<void>;
  setSessionUser: (token: string, user: UserProfile) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (
    patch: Partial<Pick<UserProfile, 'name' | 'email' | 'avatarUrl' | 'bio'>> & {
      preferences?: Partial<UserPreferences>;
    }
  ) => Promise<void>;
  addItem: <K extends CollectionKey>(
    collection: K,
    item: Omit<WorkspaceData[K][number], 'id'> & { id?: string }
  ) => Promise<WorkspaceData[K][number]>;
  updateItem: <K extends CollectionKey>(
    collection: K,
    id: string,
    patch: Partial<WorkspaceData[K][number]>
  ) => Promise<void>;
  deleteItem: <K extends CollectionKey>(collection: K, id: string) => Promise<void>;
  bulkUpdate: <K extends CollectionKey>(collection: K, items: WorkspaceData[K]) => Promise<void>;
  updateCustomNoteCategories: (categories: string[]) => Promise<void>;
  updateCalendarMood: (date: string, mood: CalendarMood | null) => Promise<void>;
  updateEmergency: (emergency: WorkspaceData['emergency']) => Promise<void>;
  restoreWorkspace: (data: WorkspaceData) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [quickCaptureOpen, setQuickCaptureOpen] = useState<QuickCaptureKind | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = useCallback((title: string, variant: ToastMessage['variant'] = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3400);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Apply light/dark/system theme and accent variables
  useEffect(() => {
    const theme = user?.preferences?.theme || 'light';
    const root = document.documentElement;
    const applyDark = (isDark: boolean) => {
      root.classList.toggle('dark', isDark);
    };
    if (theme === 'dark') {
      applyDark(true);
    } else if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      applyDark(media.matches);
      const listener = (e: MediaQueryListEvent) => applyDark(e.matches);
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    } else {
      applyDark(false);
    }
  }, [user?.preferences?.theme]);

  useEffect(() => {
    const accent = user?.preferences?.accentColor || 'sage';
    const root = document.documentElement;
    const map = {
      sage: { main: '#89977A', dark: '#64765B', soft: '#E5EBDD' },
      rose: { main: '#C98F91', dark: '#A66A6C', soft: '#F2DCD9' },
      lavender: { main: '#8E7FA8', dark: '#6C5E85', soft: '#E8E1F1' },
      ochre: { main: '#C79B55', dark: '#9C7537', soft: '#F3E8C9' },
    };
    const chosen = map[accent] || map.sage;
    root.style.setProperty('--sage', chosen.main);
    root.style.setProperty('--sage-dark', chosen.dark);
    root.style.setProperty('--sage-soft', chosen.soft);
  }, [user?.preferences?.accentColor]);

  const refreshWorkspace = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setWorkspace(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getWorkspace();
      setUser(res.user);
      setWorkspace(res.workspace);
    } catch {
      setStoredToken(null);
      setUser(null);
      setWorkspace(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshWorkspace();
  }, [refreshWorkspace]);

  // Keyboard shortcut Cmd/Ctrl + K for global search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (user) setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [user]);

  const setSessionUser = useCallback(
    async (token: string, nextUser: UserProfile) => {
      setStoredToken(token);
      setUser(nextUser);
      setLoading(true);
      await refreshWorkspace();
    },
    [refreshWorkspace]
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // ignore network error on logout
    }
    setStoredToken(null);
    setUser(null);
    setWorkspace(null);
    setActivePage('dashboard');
  }, []);

  const updateProfile = useCallback(
    async (
      patch: Partial<Pick<UserProfile, 'name' | 'email' | 'avatarUrl' | 'bio'>> & {
        preferences?: Partial<UserPreferences>;
      }
    ) => {
      const res = await api.updateProfile(patch);
      setUser(res.user);
    },
    []
  );

  const addItem = useCallback(
    async <K extends CollectionKey>(
      collection: K,
      item: Omit<WorkspaceData[K][number], 'id'> & { id?: string }
    ): Promise<WorkspaceData[K][number]> => {
      const res = await api.createItem(collection, item as Record<string, unknown>);
      const created = res.item as unknown as WorkspaceData[K][number];
      setWorkspace((prev) => {
        if (!prev) return prev;
        const list = prev[collection] as unknown[];
        return {
          ...prev,
          [collection]: [created, ...list],
        };
      });
      return created;
    },
    []
  );

  const updateItem = useCallback(
    async <K extends CollectionKey>(
      collection: K,
      id: string,
      patch: Partial<WorkspaceData[K][number]>
    ) => {
      const res = await api.updateItem(collection, id, patch);
      const updated = res.item as unknown as WorkspaceData[K][number];
      setWorkspace((prev) => {
        if (!prev) return prev;
        const list = prev[collection] as Array<{ id: string }>;
        return {
          ...prev,
          [collection]: list.map((item) => (item.id === id ? updated : item)),
        };
      });
    },
    []
  );

  const deleteItem = useCallback(async <K extends CollectionKey>(collection: K, id: string) => {
    await api.deleteItem(collection, id);
    setWorkspace((prev) => {
      if (!prev) return prev;
      const list = prev[collection] as Array<{ id: string }>;
      return {
        ...prev,
        [collection]: list.filter((item) => item.id !== id),
      };
    });
  }, []);

  const bulkUpdate = useCallback(async <K extends CollectionKey>(collection: K, items: WorkspaceData[K]) => {
    await api.bulkReplace(collection, items as unknown[]);
    setWorkspace((prev) => (prev ? { ...prev, [collection]: items } : prev));
  }, []);

  const updateCustomNoteCategories = useCallback(async (categories: string[]) => {
    const res = await api.updateCustomNoteCategories(categories);
    setWorkspace((prev) =>
      prev ? { ...prev, customNoteCategories: res.customNoteCategories } : prev
    );
  }, []);

  const updateCalendarMood = useCallback(async (date: string, mood: CalendarMood | null) => {
    const res = await api.updateCalendarMood(date, mood);
    setWorkspace((prev) => (prev ? { ...prev, calendarMoods: res.calendarMoods } : prev));
  }, []);

  const updateEmergency = useCallback(async (emergency: WorkspaceData['emergency']) => {
    const res = await api.updateEmergency(emergency);
    setWorkspace((prev) => (prev ? { ...prev, emergency: res.emergency } : prev));
  }, []);

  const restoreWorkspace = useCallback(async (data: WorkspaceData) => {
    const res = await api.restoreBackup(data);
    setWorkspace(res.workspace);
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        user,
        workspace,
        loading,
        activePage,
        setActivePage,
        quickCaptureOpen,
        openQuickCapture: setQuickCaptureOpen,
        closeQuickCapture: () => setQuickCaptureOpen(null),
        searchOpen,
        setSearchOpen,
        toasts,
        notify,
        dismissToast,
        refreshWorkspace,
        setSessionUser,
        logout,
        updateProfile,
        addItem,
        updateItem,
        deleteItem,
        bulkUpdate,
        updateCustomNoteCategories,
        updateCalendarMood,
        updateEmergency,
        restoreWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
