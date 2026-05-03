import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const UIEventContext = createContext(null);
const LOG_STORAGE_KEY = 'whiz-activity-log-v1';
const MAX_ACTIVITY_ENTRIES = 150;

const readStoredEntries = () => {
  try {
    const raw = localStorage.getItem(LOG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ACTIVITY_ENTRIES) : [];
  } catch {
    return [];
  }
};

export function UIEventProvider({ children }) {
  const handlersRef = useRef({
    onEscape: null,
    onGlobalAction: null,
  });
  const [activityEntries, setActivityEntries] = useState(readStoredEntries);
  const [lastReadAt, setLastReadAt] = useState(Date.now());

  const persistEntries = useCallback((entries) => {
    try { localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(entries)); } catch {}
  }, []);

  const registerHandlers = useCallback((handlers = {}) => {
    handlersRef.current = {
      onEscape: handlers.onEscape || null,
      onGlobalAction: handlers.onGlobalAction || null,
    };

    return () => {
      handlersRef.current = { onEscape: null, onGlobalAction: null };
    };
  }, []);

  const dispatchEscape = useCallback(() => {
    handlersRef.current.onEscape?.();
  }, []);

  const dispatchGlobalAction = useCallback((action, payload) => {
    handlersRef.current.onGlobalAction?.(action, payload);
  }, []);

  const addActivityEntry = useCallback((entry = {}) => {
    const nextEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: entry.timestamp || Date.now(),
      type: entry.type || 'system',
      status: entry.status || 'info',
      message: entry.message || '',
      metadata: entry.metadata || {},
    };
    setActivityEntries((prev) => {
      const next = [nextEntry, ...prev].slice(0, MAX_ACTIVITY_ENTRIES);
      persistEntries(next);
      return next;
    });
  }, [persistEntries]);

  const markActivityLogRead = useCallback(() => setLastReadAt(Date.now()), []);
  const unreadCount = useMemo(
    () => activityEntries.filter((entry) => Number(entry.timestamp) > lastReadAt).length,
    [activityEntries, lastReadAt],
  );

  const value = useMemo(() => ({
    registerHandlers,
    dispatchEscape,
    dispatchGlobalAction,
    activityEntries,
    addActivityEntry,
    markActivityLogRead,
    unreadCount,
  }), [registerHandlers, dispatchEscape, dispatchGlobalAction, activityEntries, addActivityEntry, markActivityLogRead, unreadCount]);

  return <UIEventContext.Provider value={value}>{children}</UIEventContext.Provider>;
}

export function useUIEventContext() {
  const ctx = useContext(UIEventContext);
  if (!ctx) {
    throw new Error('useUIEventContext must be used within UIEventProvider');
  }
  return ctx;
}
