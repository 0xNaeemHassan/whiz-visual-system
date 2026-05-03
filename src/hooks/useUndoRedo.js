import { useState, useCallback, useRef } from 'react';

const SHALLOW_PREVIEW_KEYS = [
  'title', 'deck', 'body', 'topicTag', 'status', 'date', 'tickerSpeed', 'layoutDensity', 'layoutSpacing',
];

function cloneSerializable(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function buildDiffKeys(previousState, nextState) {
  if (!previousState || !nextState) return [];
  const keys = new Set([...Object.keys(previousState), ...Object.keys(nextState)]);
  const changed = [];
  keys.forEach((key) => {
    if (JSON.stringify(previousState[key]) !== JSON.stringify(nextState[key])) changed.push(key);
  });
  return changed;
}

function buildSnapshotEntry(stateValue, reason, previousSnapshot) {
  const timestamp = Date.now();
  const changedKeys = previousSnapshot ? buildDiffKeys(previousSnapshot.state, stateValue) : [];
  const label = reason || (changedKeys.length === 1 ? `Updated ${changedKeys[0]}` : changedKeys.length > 1 ? `Updated ${changedKeys.length} keys` : 'Snapshot');
  return {
    id: `${timestamp}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp,
    label,
    reason: reason || null,
    changedKeys,
    previewKeys: changedKeys.filter((k) => SHALLOW_PREVIEW_KEYS.includes(k)).slice(0, 6),
    state: cloneSerializable(stateValue),
  };
}

export function useUndoRedo(initialState, maxHistory = 50) {
  const [state, setState] = useState(initialState);
  const [cursor, setCursor] = useState(0);
  const [history, setHistory] = useState([buildSnapshotEntry(initialState, 'Initial state', null)]);
  const historyRef = useRef([initialState]);
  const metadataRef = useRef(history);
  const debounceTimer = useRef(null);
  const pendingState = useRef(null);
  const pendingReason = useRef(null);

  const _snapshot = useCallback((newState, reason = null) => {
    const currentHistory = historyRef.current;
    const currentIndex = historyRef.index ?? 0;
    const trimmedStates = currentHistory.slice(0, currentIndex + 1);
    const trimmedMetadata = metadataRef.current.slice(0, currentIndex + 1);
    if (trimmedStates.length > 0 && JSON.stringify(trimmedStates[trimmedStates.length - 1]) === JSON.stringify(newState)) return;
    const previousSnapshot = trimmedMetadata[trimmedMetadata.length - 1] || null;
    const nextEntry = buildSnapshotEntry(newState, reason, previousSnapshot);
    trimmedStates.push(newState);
    trimmedMetadata.push(nextEntry);
    if (trimmedStates.length > maxHistory) {
      trimmedStates.shift();
      trimmedMetadata.shift();
    }
    const newIndex = trimmedStates.length - 1;
    historyRef.current = trimmedStates;
    metadataRef.current = trimmedMetadata;
    historyRef.index = newIndex;
    setHistory(trimmedMetadata);
    setCursor(newIndex);
  }, [maxHistory]);

  const set = useCallback((valueOrFn, options = {}) => {
    const { immediate = true, debounceMs = 600, reason = null } = options;
    setState(prev => {
      const newState = typeof valueOrFn === 'function' ? valueOrFn(prev) : valueOrFn;
      pendingState.current = newState;
      pendingReason.current = reason;
      if (immediate) {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
          debounceTimer.current = null;
        }
        _snapshot(newState, reason);
      } else {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
          if (pendingState.current !== null) {
            _snapshot(pendingState.current, pendingReason.current);
          }
        }, debounceMs);
      }
      return newState;
    });
  }, [_snapshot]);

  const commit = useCallback((reason = null) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    if (pendingState.current !== null) {
      _snapshot(pendingState.current, reason || pendingReason.current);
      pendingReason.current = null;
    }
  }, [_snapshot]);

  const jumpTo = useCallback((targetIndex) => {
    const len = historyRef.current.length;
    if (targetIndex < 0 || targetIndex >= len) return false;
    historyRef.index = targetIndex;
    setState(historyRef.current[targetIndex]);
    setCursor(targetIndex);
    pendingState.current = null;
    pendingReason.current = null;
    return true;
  }, []);

  const undo = useCallback(() => {
    const idx = historyRef.index ?? 0;
    if (idx > 0) {
      commit();
      const newIdx = idx - 1;
      return jumpTo(newIdx);
    }
    return false;
  }, [commit, jumpTo]);

  const redo = useCallback(() => {
    const idx = historyRef.index ?? 0;
    const len = historyRef.current.length;
    if (idx < len - 1) return jumpTo(idx + 1);
    return false;
  }, [jumpTo]);

  const reset = useCallback((newState, options = {}) => {
    const { reason = 'Reset state' } = options;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = null;
    pendingState.current = null;
    pendingReason.current = null;
    const firstEntry = buildSnapshotEntry(newState, reason, null);
    historyRef.current = [newState];
    metadataRef.current = [firstEntry];
    historyRef.index = 0;
    setState(newState);
    setHistory([firstEntry]);
    setCursor(0);
  }, []);


  const applyBulk = useCallback((valueOrFn, reason = 'Bulk replacement') => {
    set(valueOrFn, { immediate: true, reason });
  }, [set]);

  const canUndo = cursor > 0;
  const canRedo = cursor < historyRef.current.length - 1;

  return { state, set, applyBulk, undo, redo, canUndo, canRedo, reset, commit, history, cursor, jumpTo };
}
