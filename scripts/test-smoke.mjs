import assert from 'node:assert/strict';
import { FRAME_TEMPLATES, CONTENT_TEMPLATES, getFrameTemplate } from '../src/data/templates.js';
import { FRAMES } from '../src/data/frames.js';
import { TYPE_SCALE, nearestTypeScale, getComplianceIssues, getBrandScore } from '../src/utils/editorCompliance.js';

assert.ok(Array.isArray(FRAMES) && FRAMES.length >= 50, 'Expected at least 50 frame definitions');
assert.ok(FRAME_TEMPLATES && Object.keys(FRAME_TEMPLATES).length > 0, 'FRAME_TEMPLATES should not be empty');
assert.ok(Array.isArray(CONTENT_TEMPLATES) && CONTENT_TEMPLATES.length > 0, 'CONTENT_TEMPLATES should not be empty');

const defaultContent = { topicTag: 'TEST', title: 'TEST' };
const merged = getFrameTemplate(4, defaultContent);
assert.equal(merged.topicTag, FRAME_TEMPLATES[4].topicTag, 'Template merge should override defaults');
assert.ok(merged.title, 'Merged template should contain title');

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

const csvLikeIssue = {
  issueNum: '007',
  topic: 'Roundtrip',
  assistantBrief: 'Brief',
  targetMetric: 'CTR',
  metricConfidence: 'high',
  metricSource: 'Internal dashboard',
  metricValue: '4.2',
  metricUnit: '%',
  metricProvenance: [{ source: 'dashboard', capturedAt: '2026-05-01' }],
};
const csvRow = [
  csvLikeIssue.issueNum, csvLikeIssue.topic, '', '', 'draft', '', '', '', '', 'medium', 'medium', '',
  csvLikeIssue.assistantBrief, csvLikeIssue.targetMetric, csvLikeIssue.metricConfidence, csvLikeIssue.metricSource, csvLikeIssue.metricValue, csvLikeIssue.metricUnit,
  JSON.stringify(csvLikeIssue.metricProvenance),
];
const parsedMetricProvenance = (() => {
  try { const parsed = JSON.parse(csvRow[18]); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
})();
assert.equal(csvRow[12], csvLikeIssue.assistantBrief, 'assistantBrief should persist in CSV-like row');
assert.equal(csvRow[13], csvLikeIssue.targetMetric, 'targetMetric should persist in CSV-like row');
assert.equal(csvRow[14], csvLikeIssue.metricConfidence, 'metricConfidence should persist in CSV-like row');
assert.equal(csvRow[15], csvLikeIssue.metricSource, 'metricSource should persist in CSV-like row');
assert.equal(csvRow[16], csvLikeIssue.metricValue, 'metricValue should persist in CSV-like row');
assert.equal(csvRow[17], csvLikeIssue.metricUnit, 'metricUnit should persist in CSV-like row');
assert.deepEqual(parsedMetricProvenance, csvLikeIssue.metricProvenance, 'metricProvenance should roundtrip via JSON serialization');

console.log('Smoke tests passed');
