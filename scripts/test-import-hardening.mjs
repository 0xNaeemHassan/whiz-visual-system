import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { parseImportPayload, parseImportPayloadSafe } from '../src/domain/import/parser.js';
import {
  normalizeEditorState,
  normalizeEditorStateSafe,
  normalizeFrameContent,
  normalizeFrameContentSafe,
} from '../src/domain/import/normalizers.js';
import { FRAME_CONTENT_SCHEMA, EDITOR_STATE_SCHEMA } from '../src/domain/import/mappings.js';

const MAX_PARSE_MS = 500;
const MAX_NORMALIZE_MS = 1000;

function runtimeBounded(label, maxMs, fn) {
  const started = performance.now();
  const result = fn();
  const elapsed = performance.now() - started;
  assert.ok(elapsed <= maxMs, `${label} exceeded runtime budget (${elapsed.toFixed(2)}ms > ${maxMs}ms)`);
  return result;
}

const malformedInputs = [null, undefined, 7, true, Symbol('bad'), '{', '{"x":', '"scalar"', '42'];
for (const input of malformedInputs) {
  const parsed = runtimeBounded('parseImportPayload malformed input', MAX_PARSE_MS, () => parseImportPayload(input));
  assert.equal(parsed, null, 'malformed parse should safely return null');

  const safeParsed = runtimeBounded('parseImportPayloadSafe malformed input', MAX_PARSE_MS, () => parseImportPayloadSafe(input));
  assert.equal(typeof safeParsed, 'object');
  assert.equal(safeParsed.ok, false);
  assert.equal(safeParsed.value, null);
  assert.equal(typeof safeParsed.error?.code, 'string');
  assert.equal(typeof safeParsed.error?.message, 'string');
}

const hugeArray = Array.from({ length: 20000 }, (_, i) => ({ i, title: `item-${i}`, value: i * 2 }));
const oversizedPayload = JSON.stringify({
  content: { tableRows: hugeArray, stats: hugeArray, timelineEvents: hugeArray },
  overrides: { theme: 'stress' },
});

const parsedOversized = runtimeBounded('parseImportPayload oversized input', MAX_PARSE_MS, () => parseImportPayload(oversizedPayload));
assert.ok(parsedOversized && typeof parsedOversized === 'object', 'oversized payload should parse into object');

const safeOversized = runtimeBounded('parseImportPayloadSafe oversized input', MAX_PARSE_MS, () => parseImportPayloadSafe(oversizedPayload));
assert.equal(safeOversized.ok, true);
assert.equal(safeOversized.error, null);
assert.ok(safeOversized.value?.content);

const adversarialContent = {
  issue_num: { nested: ['bad'] },
  ticker_speed: 'not-a-number',
  table_rows: [null, 1, { term: 55, definition: false, group: '!' }],
  stats: [{ label: 88, value: null, provenance: '??' }],
  grid_items: [{ title: { x: 1 }, value: ['1'], sub: false }],
  timeline_events: new Array(3000).fill({ date: 'x', label: 5 }),
  evidence_ledger: 'invalid-ledger',
};

const normalizedContent = runtimeBounded('normalizeFrameContent adversarial input', MAX_NORMALIZE_MS, () => normalizeFrameContent(adversarialContent, {}));
assert.equal(typeof normalizedContent, 'object');
assert.equal(Array.isArray(normalizedContent.tableRows), true);
assert.equal(Array.isArray(normalizedContent.stats), true);
assert.equal(typeof normalizedContent.evidenceLedger, 'object');

const normalizedContentSafe = runtimeBounded('normalizeFrameContentSafe adversarial input', MAX_NORMALIZE_MS, () => normalizeFrameContentSafe(adversarialContent, {}));
assert.equal(typeof normalizedContentSafe, 'object');
assert.equal(typeof normalizedContentSafe.ok, 'boolean');
assert.ok(Array.isArray(normalizedContentSafe.errors));
assert.equal(typeof normalizedContentSafe.value, 'object');

const adversarialEditorState = {
  frame_id: 'abc',
  content: adversarialContent,
  styleOverrides: 'bad',
  aspect_ratio: '16:9',
  bg_gradient: 'oops',
  pattern_overlay: 1,
};

const normalizedEditorState = runtimeBounded('normalizeEditorState adversarial input', MAX_NORMALIZE_MS, () => normalizeEditorState(adversarialEditorState, { content: {} }));
assert.equal(typeof normalizedEditorState, 'object');
assert.equal(typeof normalizedEditorState.frameId, 'number');
assert.equal(typeof normalizedEditorState.overrides, 'object');
assert.ok(normalizedEditorState.bgGradient === null || typeof normalizedEditorState.bgGradient === 'object');

const normalizedEditorStateSafe = runtimeBounded('normalizeEditorStateSafe adversarial input', MAX_NORMALIZE_MS, () => normalizeEditorStateSafe(adversarialEditorState, { content: {} }));
assert.equal(typeof normalizedEditorStateSafe, 'object');
assert.equal(typeof normalizedEditorStateSafe.ok, 'boolean');
assert.ok(Array.isArray(normalizedEditorStateSafe.errors));
assert.equal(typeof normalizedEditorStateSafe.value, 'object');

for (const [key, spec] of Object.entries(FRAME_CONTENT_SCHEMA)) {
  assert.ok(Array.isArray(spec.aliases) && spec.aliases.length > 0, `FRAME_CONTENT_SCHEMA.${key} aliases must be non-empty array`);
  assert.equal(typeof spec.type, 'string', `FRAME_CONTENT_SCHEMA.${key} type must be string`);
}
for (const [key, spec] of Object.entries(EDITOR_STATE_SCHEMA)) {
  assert.ok(Array.isArray(spec.aliases) && spec.aliases.length > 0, `EDITOR_STATE_SCHEMA.${key} aliases must be non-empty array`);
  assert.equal(typeof spec.type, 'string', `EDITOR_STATE_SCHEMA.${key} type must be string`);
}

console.log('Import hardening tests passed');
