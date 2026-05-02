function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

export function validateEditorImport(raw) {
  const errors = [];

  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, errors: ['payload must be an object'] };
  }

  if (raw.content !== undefined && !isPlainObject(raw.content)) {
    errors.push('content must be an object');
  }

  if (raw.overrides !== undefined && !isPlainObject(raw.overrides)) {
    errors.push('overrides must be an object');
  }

  return { valid: errors.length === 0, errors };
}

export function normalizeEditorImport(raw = {}) {
  const safeRaw = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  return {
    content: isPlainObject(safeRaw.content) ? safeRaw.content : {},
    overrides: isPlainObject(safeRaw.overrides) ? safeRaw.overrides : {},
  };
}

export { isPlainObject };
