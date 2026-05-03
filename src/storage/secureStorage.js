const STORAGE_MODE = {
  MEMORY_ONLY: 'memory-only',
  PERSISTENT: 'persistent',
  ENCRYPTED_PERSISTENT: 'encrypted-persistent',
};

const FALLBACK_REASON = {
  UNAVAILABLE: 'unavailable',
  POLICY_BLOCKED: 'policy-blocked',
  QUOTA_EXCEEDED: 'quota-exceeded',
  ERROR: 'error',
};

const memoryStore = new Map();
let activeStorageMode = STORAGE_MODE.PERSISTENT;

function emitFallbackTelemetry({ key, namespace, reason, error }) {
  const payload = {
    key,
    namespace,
    reason,
    mode: activeStorageMode,
    message: error?.message,
    name: error?.name,
    timestamp: new Date().toISOString(),
  };

  try {
    window.dispatchEvent(new CustomEvent('whiz-storage-fallback', { detail: payload }));
  } catch {}

  console.warn('[storage:fallback]', payload);
}

function getPersistentStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage;
}

function encodeValue(mode, value) {
  const serialized = JSON.stringify(value);
  if (mode === STORAGE_MODE.ENCRYPTED_PERSISTENT) {
    return `enc:v1:${typeof window !== 'undefined' && window.btoa ? window.btoa(serialized) : serialized}`;
  }
  return serialized;
}

function decodeValue(raw) {
  if (typeof raw !== 'string') return null;
  if (raw.startsWith('enc:v1:')) {
    const encoded = raw.slice('enc:v1:'.length);
    const decoded = typeof window !== 'undefined' && window.atob ? window.atob(encoded) : encoded;
    return JSON.parse(decoded);
  }
  return JSON.parse(raw);
}

function readRaw(key, namespace = 'settings') {
  if (memoryStore.has(key)) return memoryStore.get(key);

  if (activeStorageMode === STORAGE_MODE.MEMORY_ONLY) return null;

  const persistent = getPersistentStorage();
  if (!persistent) {
    emitFallbackTelemetry({ key, namespace, reason: FALLBACK_REASON.UNAVAILABLE });
    return null;
  }

  try {
    return persistent.getItem(key);
  } catch (error) {
    emitFallbackTelemetry({ key, namespace, reason: FALLBACK_REASON.ERROR, error });
    return null;
  }
}

function writeRaw(key, raw, namespace = 'settings') {
  memoryStore.set(key, raw);

  if (activeStorageMode === STORAGE_MODE.MEMORY_ONLY) return true;

  const persistent = getPersistentStorage();
  if (!persistent) {
    emitFallbackTelemetry({ key, namespace, reason: FALLBACK_REASON.UNAVAILABLE });
    return false;
  }

  try {
    persistent.setItem(key, raw);
    return true;
  } catch (error) {
    const reason = error?.name === 'QuotaExceededError' ? FALLBACK_REASON.QUOTA_EXCEEDED : FALLBACK_REASON.ERROR;
    emitFallbackTelemetry({ key, namespace, reason, error });
    return false;
  }
}

function removeRaw(key, namespace = 'settings') {
  memoryStore.delete(key);
  if (activeStorageMode === STORAGE_MODE.MEMORY_ONLY) return;
  try {
    getPersistentStorage()?.removeItem(key);
  } catch (error) {
    emitFallbackTelemetry({ key, namespace, reason: FALLBACK_REASON.ERROR, error });
  }
}

function createNamespaceApi(namespace) {
  return {
    get(key, fallbackValue = null) {
      const raw = readRaw(key, namespace);
      if (raw == null) return fallbackValue;
      try {
        return decodeValue(raw);
      } catch (error) {
        emitFallbackTelemetry({ key, namespace, reason: FALLBACK_REASON.ERROR, error });
        return fallbackValue;
      }
    },
    set(key, value) {
      const raw = encodeValue(activeStorageMode, value);
      return writeRaw(key, raw, namespace);
    },
    remove(key) {
      removeRaw(key, namespace);
    },
  };
}

export const secureStorage = {
  getMode: () => activeStorageMode,
  setMode: (mode) => {
    if (!Object.values(STORAGE_MODE).includes(mode)) throw new Error(`Unknown storage mode: ${mode}`);
    activeStorageMode = mode;
  },
  clearMemory: () => memoryStore.clear(),
  drafts: createNamespaceApi('drafts'),
  settings: createNamespaceApi('settings'),
  uiState: createNamespaceApi('ui-state'),
  raw: {
    getItem: (key) => readRaw(key, 'settings'),
    setItem: (key, raw) => writeRaw(key, raw, 'settings'),
    removeItem: (key) => removeRaw(key, 'settings'),
  },
};

export { STORAGE_MODE, FALLBACK_REASON };
