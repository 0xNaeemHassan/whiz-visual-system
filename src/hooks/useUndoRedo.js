import { useState, useCallback, useRef } from 'react';

// Fix #1: canUndo/canRedo tracked in reactive state.
// Fix #10: index stored on historyRef to avoid batching races.
// M-14: set() accepts (value, { immediate }) — immediate=false debounces to avoid
//        per-keystroke history bloat. commit() forces a history snapshot immediately.
export function useUndoRedo(initialState, maxHistory = 50) {
  const [state, setState] = useState(initialState);
  const [cursor, setCursor] = useState(0);
  const historyRef = useRef([initialState]);
  const debounceTimer = useRef(null);
  const pendingState = useRef(null);

  // Internal snapshot: saves current pending state to history
  const _snapshot = useCallback((newState) => {
    const currentHistory = historyRef.current;
    const currentIndex = historyRef.index ?? 0;
    const trimmed = currentHistory.slice(0, currentIndex + 1);
    // Avoid duplicate entries
    if (trimmed.length > 0 && JSON.stringify(trimmed[trimmed.length - 1]) === JSON.stringify(newState)) return;
    trimmed.push(newState);
    if (trimmed.length > maxHistory) trimmed.shift();
    const newIndex = trimmed.length - 1;
    historyRef.current = trimmed;
    historyRef.index = newIndex;
    setCursor(newIndex);
  }, [maxHistory]);

  // set(value, { immediate: true }) — add to history immediately (non-text changes)
  // set(value, { immediate: false }) — update state immediately but debounce history (text typing)
  const set = useCallback((valueOrFn, options = {}) => {
    const { immediate = true, debounceMs = 600 } = options;
    setState(prev => {
      const newState = typeof valueOrFn === 'function' ? valueOrFn(prev) : valueOrFn;
      pendingState.current = newState;
      if (immediate) {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
          debounceTimer.current = null;
        }
        _snapshot(newState);
      } else {
        // Debounce: wait debounceMs after last keystroke before committing to history
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
          if (pendingState.current !== null) {
            _snapshot(pendingState.current);
          }
        }, debounceMs);
      }
      return newState;
    });
  }, [_snapshot]);

  // Explicit commit — flush any pending debounced change to history NOW
  const commit = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    if (pendingState.current !== null) {
      _snapshot(pendingState.current);
    }
  }, [_snapshot]);

  const undo = useCallback(() => {
    const idx = historyRef.index ?? 0;
    if (idx > 0) {
      commit(); // flush any pending before undoing
      const newIdx = idx - 1;
      historyRef.index = newIdx;
      const prev = historyRef.current[newIdx];
      setState(prev);
      setCursor(newIdx);
      pendingState.current = null;
      return true;
    }
    return false;
  }, [commit]);

  const redo = useCallback(() => {
    const idx = historyRef.index ?? 0;
    const len = historyRef.current.length;
    if (idx < len - 1) {
      const newIdx = idx + 1;
      historyRef.index = newIdx;
      const next = historyRef.current[newIdx];
      setState(next);
      setCursor(newIdx);
      pendingState.current = null;
      return true;
    }
    return false;
  }, []);

  const reset = useCallback((newState) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = null;
    pendingState.current = null;
    historyRef.current = [newState];
    historyRef.index = 0;
    setState(newState);
    setCursor(0);
  }, []);

  const canUndo = cursor > 0;
  const canRedo = cursor < historyRef.current.length - 1;

  return { state, set, undo, redo, canUndo, canRedo, reset, commit };
}
