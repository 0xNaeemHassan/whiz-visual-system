import { FRAME_CONTENT_SCHEMA, EDITOR_STATE_SCHEMA } from './mappings';

function toString(v, fallback = '') { return v == null ? fallback : String(v); }
function toNumber(v, fallback = 0) { const n = Number(v); return Number.isFinite(n) ? n : fallback; }
function toStringArray(v) { return Array.isArray(v) ? v.map((x) => toString(x)).filter(Boolean) : []; }
function toObject(v, fallback = {}) { return v && typeof v === 'object' && !Array.isArray(v) ? v : fallback; }

function coerce(type, value) {
  switch (type) {
    case 'string': return toString(value);
    case 'number': return toNumber(value);
    case 'object': return toObject(value, {});
    case 'objectOrNull': return value == null ? null : toObject(value, null);
    case 'stringArray': return toStringArray(value);
    case 'statArray': return Array.isArray(value) ? value.map((s) => ({ label: toString(s?.label), value: toString(s?.value) })) : [];
    case 'tableRows': return Array.isArray(value) ? value.map((row) => toObject(row, {})) : [];
    case 'gridItems': return Array.isArray(value) ? value.map((it) => ({ title: toString(it?.title), value: toString(it?.value), sub: toString(it?.sub) })) : [];
    case 'timelineEvents': return Array.isArray(value) ? value.map((it) => ({ date: toString(it?.date), label: toString(it?.label), sub: toString(it?.sub) })) : [];
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
  return { ...defaults, ...normalizeBySchema(raw, FRAME_CONTENT_SCHEMA) };
}

export function normalizeEditorState(raw, defaults = {}) {
  const normalized = normalizeBySchema(raw, EDITOR_STATE_SCHEMA);
  if (normalized.content) {
    normalized.content = normalizeFrameContent(normalized.content, defaults.content || {});
  }
  return { ...defaults, ...normalized };
}
