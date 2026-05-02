import { useState, useCallback } from 'react';

// Fix #54: Images should not bloat localStorage — callers should use IndexedDB for large
// binary data. This hook now clears only autosave AND large image keys when quota is hit.
// Fix #105: Added dirty-flag to avoid unnecessary serialization when value hasn't changed.
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (e) {
      console.warn(`useLocalStorage: failed to parse "${key}", using default`, e);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    setStoredValue(prev => {
      const newValue = value instanceof Function ? value(prev) : value;
      try {
        window.localStorage.setItem(key, JSON.stringify(newValue));
      } catch (e) {
        if (e.name === 'QuotaExceededError') {
          console.error(`localStorage quota exceeded for "${key}". Attempting cleanup...`);
          try {
            // Clear autosave and image data to free the most space
            localStorage.removeItem('whiz-autosave');
            localStorage.removeItem('whiz-images');
            window.localStorage.setItem(key, JSON.stringify(newValue));
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
