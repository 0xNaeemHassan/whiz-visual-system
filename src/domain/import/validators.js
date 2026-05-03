const LIMITS = {
  maxStringLength: 4000,
  maxArrayLength: 200,
  maxObjectKeys: 200,
  maxNestingDepth: 12,
};

const SUSPICIOUS_PATTERN = /(<\/?\w+[^>]*>|<script\b|javascript:|data:text\/html|on\w+\s*=|\b(?:eval|Function)\s*\()/i;

const CONTENT_ALLOWED_KEYS = new Set([
  'issueNum','date','desk','volume','topicTag','title','deck','body','handle','socialX','socialSub','status','tickerSpeed','sparkData','stats','tableRows','tableHeaders','bullPoints','bearPoints','bigNumber','bigLabel','verdict','gridItems','timelineEvents','nextDrop','pullQuote','heroUrl','logoUrl','sourceLinks','evidenceLedger',
]);

const EDITOR_ALLOWED_KEYS = new Set([
  'frameId','theme','content','overrides','aspectRatio','bgGradient','patternOverlay',
]);

function isPlainObject(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }

function createError(code, path, message, meta = {}) { return { code, path, message, ...meta }; }

function sanitizeString(value, path, errors) {
  let out = String(value ?? '');
  if (SUSPICIOUS_PATTERN.test(out)) {
    errors.push(createError('SANITIZED_SUSPICIOUS_STRING', path, 'Suspicious string payload was neutralized.'));
    out = out.replace(/[<>]/g, '');
    out = out.replace(/javascript:/gi, '');
    out = out.replace(/on\w+\s*=/gi, '');
  }
  if (out.length > LIMITS.maxStringLength) {
    errors.push(createError('STRING_TOO_LONG', path, 'String exceeded maximum length and was truncated.', { max: LIMITS.maxStringLength }));
    out = out.slice(0, LIMITS.maxStringLength);
  }
  return out;
}

function sanitizeDeep(input, path, depth, errors) {
  if (depth > LIMITS.maxNestingDepth) {
    errors.push(createError('NESTING_DEPTH_EXCEEDED', path, 'Value exceeded max nesting depth.'));
    return null;
  }
  if (typeof input === 'string' || input == null || typeof input === 'number' || typeof input === 'boolean') {
    return typeof input === 'string' ? sanitizeString(input, path, errors) : input;
  }
  if (Array.isArray(input)) {
    const limited = input.slice(0, LIMITS.maxArrayLength);
    if (input.length > LIMITS.maxArrayLength) {
      errors.push(createError('ARRAY_TOO_LONG', path, 'Array exceeded maximum length and was truncated.', { max: LIMITS.maxArrayLength }));
    }
    return limited.map((v, i) => sanitizeDeep(v, `${path}[${i}]`, depth + 1, errors));
  }
  if (isPlainObject(input)) {
    const entries = Object.entries(input).slice(0, LIMITS.maxObjectKeys);
    if (Object.keys(input).length > LIMITS.maxObjectKeys) {
      errors.push(createError('OBJECT_TOO_LARGE', path, 'Object exceeded maximum key count and was truncated.', { max: LIMITS.maxObjectKeys }));
    }
    const out = {};
    entries.forEach(([k, v]) => { out[k] = sanitizeDeep(v, `${path}.${k}`, depth + 1, errors); });
    return out;
  }
  errors.push(createError('UNSUPPORTED_VALUE_TYPE', path, 'Unsupported value type encountered.'));
  return null;
}

function validateAllowedKeys(obj, allowed, path, errors) {
  if (!isPlainObject(obj)) return;
  Object.keys(obj).forEach((key) => {
    if (!allowed.has(key)) errors.push(createError('DISALLOWED_KEY', `${path}.${key}`, 'Unexpected key is not allowed.'));
  });
}

export function sanitizeAndValidateImportPayload(raw) {
  const errors = [];
  const sanitized = sanitizeDeep(raw, '$', 0, errors);
  return { value: sanitized, errors };
}

export function validateEditorStateShape(editorState) {
  const errors = [];
  if (!isPlainObject(editorState)) {
    errors.push(createError('INVALID_EDITOR_STATE', '$', 'Editor state must be an object.'));
    return { ok: false, errors };
  }

  validateAllowedKeys(editorState, EDITOR_ALLOWED_KEYS, '$', errors);

  if (editorState.content != null) {
    if (!isPlainObject(editorState.content)) {
      errors.push(createError('INVALID_CONTENT_BLOCK', '$.content', 'content must be an object.'));
    } else {
      validateAllowedKeys(editorState.content, CONTENT_ALLOWED_KEYS, '$.content', errors);

      if (editorState.content.stats != null && !Array.isArray(editorState.content.stats)) {
        errors.push(createError('INVALID_STATS_BLOCK', '$.content.stats', 'stats must be an array.'));
      }
      if (editorState.content.gridItems != null && !Array.isArray(editorState.content.gridItems)) {
        errors.push(createError('INVALID_GRID_ITEMS_BLOCK', '$.content.gridItems', 'gridItems must be an array.'));
      }
      if (editorState.content.tableRows != null && !Array.isArray(editorState.content.tableRows)) {
        errors.push(createError('INVALID_TABLE_ROWS_BLOCK', '$.content.tableRows', 'tableRows must be an array.'));
      }
      if (editorState.content.timelineEvents != null && !Array.isArray(editorState.content.timelineEvents)) {
        errors.push(createError('INVALID_TIMELINE_EVENTS_BLOCK', '$.content.timelineEvents', 'timelineEvents must be an array.'));
      }
    }
  }

  return { ok: errors.length === 0, errors };
}
