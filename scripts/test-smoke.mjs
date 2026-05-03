import assert from 'node:assert/strict';
import { FRAME_TEMPLATES, CONTENT_TEMPLATES, getFrameTemplate } from '../src/data/templates.js';
import { REQUIRED_CONTENT_KEYS, hasRequiredContentShape } from '../src/domain/editorDefaults.js';
import { FRAMES } from '../src/data/frames.js';
import { TYPE_SCALE, nearestTypeScale, getComplianceIssues, getBrandScore } from '../src/utils/editorCompliance.js';
import { normalizePlannerIssue, validatePlannerIssue } from '../src/utils/schemaContracts.js';

assert.ok(Array.isArray(FRAMES) && FRAMES.length >= 50, 'Expected at least 50 frame definitions');
assert.ok(FRAME_TEMPLATES && Object.keys(FRAME_TEMPLATES).length > 0, 'FRAME_TEMPLATES should not be empty');
assert.ok(Array.isArray(CONTENT_TEMPLATES) && CONTENT_TEMPLATES.length > 0, 'CONTENT_TEMPLATES should not be empty');

const merged = getFrameTemplate(4);
assert.equal(merged.topicTag, FRAME_TEMPLATES[4].topicTag, 'Template merge should override defaults');
assert.ok(merged.title, 'Merged template should contain title');
assert.ok(hasRequiredContentShape(merged), 'Merged template must preserve required content keys');
for (const key of REQUIRED_CONTENT_KEYS) {
  assert.ok(Object.hasOwn(merged, key), `Merged template should include required key: ${key}`);
}

for (const item of CONTENT_TEMPLATES) {
  assert.ok(item.id && item.name && item.content, 'Each content template should have id/name/content');
}

assert.deepEqual(TYPE_SCALE, [10, 12, 14, 18, 24, 36, 56, 84], 'Type scale contract changed unexpectedly');
assert.equal(nearestTypeScale(53), 56, 'nearestTypeScale should snap to nearest value');
const issues = getComplianceIssues({
  overrides: {
    title: { fontSize: 55 },
    deck: { fontSize: 18 },
    body: { fontSize: 15 },
    spineColor: '#fff',
    tickerColor: '#fff',
    statsColor: '#fff',
    bignumColor: '#fff',
    ruleBg: '#fff',
  },
  content: { title: '', topicTag: '' },
});
assert.ok(issues.some((i) => i.includes('Too many accent overrides')), 'Should detect accent overuse');
assert.ok(issues.some((i) => i.includes('off-scale')), 'Should detect off-scale type');
assert.ok(issues.some((i) => i.includes('Title is required')), 'Should require title');
assert.ok(issues.some((i) => i.includes('Topic tag is required')), 'Should require topic tag');
const score = getBrandScore({
  overrides: { title: { fontSize: 56 }, deck: { fontSize: 18 }, body: { fontSize: 14 } },
  content: { title: 'OK', topicTag: 'OK', issueNum: '047', tickerSpeed: 28, stats: [{ label: 'TVL', value: '$1B' }], sourceLinks: 'https://example.com' },
});
assert.equal(score.score, 100, 'Fully compliant payload should score 100');


const buildManifestPayload = ({ content = {} }) => ({
  targetMetric: content.targetMetric || '',
  metricConfidence: content.metricConfidence || '',
  metricProvenance: Array.isArray(content.metricProvenance)
    ? content.metricProvenance
    : (content.metricProvenance ? [content.metricProvenance] : []),
});

const manifestPayload = buildManifestPayload({
  content: {
    targetMetric: 'DAU',
    metricConfidence: 'high',
    metricProvenance: ['internal-analytics'],
  },
});
assert.equal(manifestPayload.targetMetric, 'DAU', 'Manifest payload should include targetMetric when present');
assert.equal(manifestPayload.metricConfidence, 'high', 'Manifest payload should include metricConfidence when present');
assert.deepEqual(manifestPayload.metricProvenance, ['internal-analytics'], 'Manifest payload should include metricProvenance when present');



const normalizedPlannerIssue = normalizePlannerIssue({
  metricSource: ' Internal Dashboard ',
  metricValue: 42,
  metricUnit: ' % ',
  metricProvenance: [{ source: 'internal' }],
});
assert.equal(normalizedPlannerIssue.metricSource, 'Internal Dashboard', 'normalizePlannerIssue should keep canonical metricSource');
assert.equal(normalizedPlannerIssue.metricValue, '42', 'normalizePlannerIssue should stringify canonical metricValue');
assert.equal(normalizedPlannerIssue.metricUnit, '%', 'normalizePlannerIssue should trim canonical metricUnit');
assert.deepEqual(normalizedPlannerIssue.metricProvenance, [{ source: 'internal' }], 'normalizePlannerIssue should preserve metricProvenance');

const plannerIssueValidation = validatePlannerIssue(normalizedPlannerIssue);
assert.equal(plannerIssueValidation.valid, true, 'validatePlannerIssue should accept canonical metric fields');

const invalidPlannerIssueValidation = validatePlannerIssue({ metricSource: {}, metricProvenance: 'bad' });
assert.equal(invalidPlannerIssueValidation.valid, false, 'validatePlannerIssue should reject invalid metric field types');
assert.ok(invalidPlannerIssueValidation.errors.includes('metricSource must be a string'), 'validatePlannerIssue should validate metricSource type');
assert.ok(invalidPlannerIssueValidation.errors.includes('metricProvenance must be an array'), 'validatePlannerIssue should validate metricProvenance type');

const existingIssue = normalizePlannerIssue({
  id: 'i_1',
  metricSource: 'Glassnode',
  metricValue: '12345',
  metricUnit: 'USD',
  metricProvenance: [{ source: 'glassnode', method: 'api' }],
});
const editedIssue = { ...existingIssue, topic: 'Updated topic' };
assert.equal(editedIssue.metricSource, 'Glassnode', 'Editing should preserve raw metricSource');
assert.equal(editedIssue.metricValue, '12345', 'Editing should preserve raw metricValue');
assert.equal(editedIssue.metricUnit, 'USD', 'Editing should preserve raw metricUnit');
assert.deepEqual(editedIssue.metricProvenance, [{ source: 'glassnode', method: 'api' }], 'Editing should preserve metricProvenance metadata');

console.log('Smoke tests passed');
import './test-editor-mutations.mjs';
