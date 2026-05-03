export function parseImportPayload(input) {
  if (typeof input !== 'string') return null;
  try {
    const parsed = JSON.parse(input);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function parseImportPayloadSafe(input) {
  if (typeof input !== 'string') {
    return {
      ok: false,
      value: null,
      error: { code: 'INVALID_INPUT_TYPE', message: 'Import payload must be a JSON string.' },
    };
  }

  try {
    const parsed = JSON.parse(input);
    if (!parsed || typeof parsed !== 'object') {
      return {
        ok: false,
        value: null,
        error: { code: 'INVALID_JSON_SHAPE', message: 'Import payload JSON must resolve to an object.' },
      };
    }

    return { ok: true, value: parsed, error: null };
  } catch {
    return {
      ok: false,
      value: null,
      error: { code: 'JSON_PARSE_FAILED', message: 'Failed to parse JSON import payload.' },
    };
  }
}
