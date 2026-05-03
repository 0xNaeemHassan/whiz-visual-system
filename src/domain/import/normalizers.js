import { FRAME_CONTENT_SCHEMA, EDITOR_STATE_SCHEMA } from './mappings.js';
import { normalizeContentTaxonomy } from '../../utils/contentNormalization.js';
import { normalizeDateInput, normalizeTimelineEvents } from '../services/dateNormalizationService.js';
import { normalizeProvenanceShape } from '../../utils/provenance.js';
import { sanitizeAndValidateImportPayload, validateEditorStateShape } from './validators.js';

function toString(v, fallback = '') { return v == null ? fallback : String(v); }
function toNumber(v, fallback = 0) { const n = Number(v); return Number.isFinite(n) ? n : fallback; }
function toStringArray(v) { return Array.isArray(v) ? v.map((x) => toString(x)).filter(Boolean) : []; }
function toObject(v, fallback = {}) { return v && typeof v === 'object' && !Array.isArray(v) ? v : fallback; }

function normalizeGlossaryGroup(group, term = '') {
  const explicit = toString(group).trim().toUpperCase();
  if (/^[A-Z]$/.test(explicit)) return explicit;
  const trimmedTerm = toString(term).trim();
  if (!trimmedTerm) return '#';
  const first = trimmedTerm.charAt(0).toUpperCase();
  return /^[A-Z]$/.test(first) ? first : '#';
}

function coerce(type, value) {
  switch (type) {
    case 'string': return toString(value);
    case 'number': return toNumber(value);
    case 'object': return toObject(value, {});
    case 'objectOrNull': return value == null ? null : toObject(value, null);
    case 'stringArray': return toStringArray(value);
    case 'statArray': return Array.isArray(value) ? value.map((s) => ({ label: toString(s?.label), value: toString(s?.value), provenance: normalizeProvenanceShape(s?.provenance) })) : [];
    case 'tableRows': return Array.isArray(value) ? value.map((row) => {
      const normalizedRow = toObject(row, {});
      const term = toString(normalizedRow.term || normalizedRow.col1);
      const definition = toString(normalizedRow.definition || normalizedRow.col2);
      const group = normalizeGlossaryGroup(normalizedRow.group, term);
      return { ...normalizedRow, term, definition, group, col1: term, col2: definition, provenance: normalizeProvenanceShape(normalizedRow.provenance) };
    }) : [];
    case 'gridItems': return Array.isArray(value) ? value.map((it) => ({ title: toString(it?.title), value: toString(it?.value), sub: toString(it?.sub) })) : [];
    case 'timelineEvents': return normalizeTimelineEvents(value);
    default: return value;
  }
}

function normalizeBySchema(raw, schema) {
  const source = toObject(raw, {});
  const out = {};
  Object.entries(schema).forEach(([targetKey, spec]) => {
    const sourceKey = spec.aliases.find((alias) => alias in source);
    if (!sourceKey) return;
    out[targetKey] = coerce(spec.type, source[sourceKey]);
  });
  return out;
}

export function normalizeFrameContent(raw, defaults = {}) {
  const source = toObject(raw, {});
  const merged = { ...defaults, ...source, ...normalizeBySchema(source, FRAME_CONTENT_SCHEMA) };
  const normalizedDate = normalizeDateInput(merged.date);
  if (normalizedDate.valid) merged.date = normalizedDate.displayDate;
  return normalizeContentTaxonomy(merged).content;
}

export function normalizeFrameContentSafe(raw, defaults = {}) {
  try {
    const { value: sanitized, errors } = sanitizeAndValidateImportPayload(raw);
    const normalized = normalizeFrameContent(sanitized, defaults);
    return {
      ok: true,
      value: normalized,
      errors,
    };
  } catch {
    return {
      ok: false,
      value: { ...toObject(defaults, {}) },
      errors: [{ code: 'NORMALIZE_FRAME_CONTENT_FAILED', message: 'Failed to normalize frame content.' }],
    };
  }
}

export function normalizeEditorState(raw, defaults = {}) {
  const normalized = normalizeBySchema(raw, EDITOR_STATE_SCHEMA);
  if (normalized.content) {
    normalized.content = normalizeFrameContent(normalized.content, defaults.content || {});
  }
  return { ...defaults, ...normalized };
}

export function normalizeEditorStateSafe(raw, defaults = {}) {
  try {
    const { value: sanitized, errors: sanitizeErrors } = sanitizeAndValidateImportPayload(raw);
    const schemaValidation = validateEditorStateShape(toObject(sanitized, {}));
    const normalized = normalizeEditorState(sanitized, defaults);
    return {
      ok: schemaValidation.ok,
      value: normalized,
      errors: [...sanitizeErrors, ...schemaValidation.errors],
    };
  } catch {
    return {
      ok: false,
      value: { ...toObject(defaults, {}), content: toObject(defaults?.content, {}) },
      errors: [{ code: 'NORMALIZE_EDITOR_STATE_FAILED', message: 'Failed to normalize editor state.' }],
    };
  }
}
