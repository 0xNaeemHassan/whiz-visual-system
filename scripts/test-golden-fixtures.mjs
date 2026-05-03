import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getFrameTemplate } from '../src/data/templates.js';
import { hasRequiredContentShape, REQUIRED_CONTENT_KEYS, createDefaultOverrides } from '../src/domain/editorDefaults.js';
import { normalizeTimelineEvents } from '../src/domain/services/dateNormalizationService.js';
import { computeBracketProgression } from '../src/domain/services/bracketProgressionService.js';
import { createDatasetSnapshot } from '../src/utils/exportSnapshot.js';

const readJson = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));
const stable = (value) => {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((acc, key) => {
      acc[key] = stable(value[key]);
      return acc;
    }, {});
  }
  return value;
};
const stableStringify = (value) => JSON.stringify(stable(value));

const timelineInput = readJson('fixtures/golden/inputs/timeline-events.json');
const expectedTimeline = readJson('fixtures/golden/expected/normalized/timeline-events.json');
const timelineActual = normalizeTimelineEvents(timelineInput.events);
assert.equal(stableStringify(timelineActual), stableStringify(expectedTimeline), 'timeline normalization fixture mismatch');
assert.ok(timelineActual.every((entry) => typeof entry.date === 'string' && typeof entry.isoDate === 'string'), 'timeline schema invalid');

const templateExpected = readJson('fixtures/golden/expected/normalized/template-frame-16.json');
const templateActual = getFrameTemplate(readJson('fixtures/golden/inputs/template-frame-16.json').frameId);
const templateProjection = {
  frameId: 16,
  topicTag: templateActual.topicTag,
  title: templateActual.title,
  deck: templateActual.deck,
  tableHeaders: templateActual.tableHeaders,
  firstRow: templateActual.tableRows?.[0],
  hasRequiredKeys: hasRequiredContentShape(templateActual),
};
assert.equal(stableStringify(templateProjection), stableStringify(templateExpected), 'template normalization fixture mismatch');
assert.ok(REQUIRED_CONTENT_KEYS.every((key) => Object.hasOwn(templateActual, key)), 'template required key schema mismatch');

const bracketInput = readJson('fixtures/golden/inputs/bracket.json');
const expectedBracket = readJson('fixtures/golden/expected/render/bracket-progression.json');
const bracketActual = computeBracketProgression(bracketInput);
assert.equal(stableStringify(bracketActual), stableStringify(expectedBracket), 'bracket render fixture mismatch');
assert.equal(typeof bracketActual.bracketWinner.name, 'string', 'bracket winner schema invalid');

const expectedExport = readJson('fixtures/golden/expected/export/dataset-snapshot.json');
const exportSnapshot = createDatasetSnapshot({
  frameId: 16,
  theme: 'dark',
  content: templateActual,
  overrides: createDefaultOverrides(),
  aspectRatio: '16:9',
  bgGradient: null,
  patternOverlay: null,
});
const exportProjection = {
  schemaVersion: exportSnapshot.schemaVersion,
  hash: exportSnapshot.hash,
  snapshotId: exportSnapshot.snapshotId,
  serialized: exportSnapshot.serialized,
};
assert.equal(stableStringify(exportProjection), stableStringify(expectedExport), 'export fixture mismatch');
assert.match(exportSnapshot.snapshotId, /^1\.0\.0:[a-f0-9]{8}$/, 'snapshot id schema invalid');

console.log('Golden fixture tests passed');
