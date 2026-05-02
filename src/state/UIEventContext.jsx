import { createContext, useCallback, useContext, useMemo, useRef } from 'react';

const UIEventContext = createContext(null);

export function UIEventProvider({ children }) {
  const handlersRef = useRef({
    onEscape: null,
    onGlobalAction: null,
  });

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

  const value = useMemo(() => ({
    registerHandlers,
    dispatchEscape,
    dispatchGlobalAction,
  }), [registerHandlers, dispatchEscape, dispatchGlobalAction]);

  return <UIEventContext.Provider value={value}>{children}</UIEventContext.Provider>;
}

export function useUIEventContext() {
  const ctx = useContext(UIEventContext);
  if (!ctx) {
    throw new Error('useUIEventContext must be used within UIEventProvider');
  }
  return ctx;
}
