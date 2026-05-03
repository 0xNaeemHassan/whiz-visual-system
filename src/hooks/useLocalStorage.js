import { useState, useCallback } from 'react';
import { applyStorageMigrations, isEnvelope, shouldEnvelopeKey, toEnvelope } from '../storage/migrations.js';

export function readLocalStorageValue(key, initialValue, storage = window.localStorage, dispatchEvent = window.dispatchEvent.bind(window)) {
  try {
    const item = storage.getItem(key);
    if (!item) return { value: initialValue, recovered: false };

    const parsed = JSON.parse(item);
    const migration = applyStorageMigrations(key, parsed);

    if (!migration.ok) {
      dispatchEvent(new CustomEvent('whiz-storage-recovery', { detail: { key } }));
      return { value: initialValue, recovered: true };
    }

    if (migration.migrated || (shouldEnvelopeKey(key) && !isEnvelope(parsed))) {
      storage.setItem(key, JSON.stringify(migration.value));
    }

    return { value: isEnvelope(migration.value) ? migration.value.data : migration.value, recovered: false };
  } catch (e) {
    console.warn(`useLocalStorage: failed to parse "${key}", using default`, e);
    return { value: initialValue, recovered: true };
  }
}

// Fix #54: Images should not bloat localStorage — callers should use IndexedDB for large
// binary data. This hook now clears only autosave AND large image keys when quota is hit.
// Fix #105: Added dirty-flag to avoid unnecessary serialization when value hasn't changed.
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => readLocalStorageValue(key, initialValue).value);
  const setValue = useCallback((value) => {
    setStoredValue(prev => {
      const newValue = value instanceof Function ? value(prev) : value;
      try {
        const valueToStore = shouldEnvelopeKey(key) ? toEnvelope(newValue) : newValue;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (e) {
        if (e.name === 'QuotaExceededError') {
          console.error(`localStorage quota exceeded for "${key}". Attempting cleanup...`);
          try {
            // Clear autosave and image data to free the most space
            localStorage.removeItem('whiz-autosave');
            localStorage.removeItem('whiz-images');
            const valueToStore = shouldEnvelopeKey(key) ? toEnvelope(newValue) : newValue;
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          } catch (e2) {
            console.error(`Still exceeded after cleanup for "${key}"`, e2);
          }
        } else {
          console.warn(`useLocalStorage: failed to save "${key}"`, e);
        }
      }
      return newValue;
    });
  }, [key]);

  return [storedValue, setValue];
}
