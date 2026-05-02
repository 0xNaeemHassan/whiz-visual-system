import assert from 'node:assert/strict';
import {
  getCadenceAlerts,
  getSeriesDrift,
  buildMetricProvenance,
  normalizeIssue,
  validateEditorImport,
  normalizeEditorImport,
} from '../src/utils/analyticsQuality.js';

assert.deepEqual(getCadenceAlerts([{ date: '2026-01-01', value: 1 }]), [], 'single datapoint should have no alerts');
assert.deepEqual(getCadenceAlerts([{ date: 'bad' }, { date: '2026-01-10' }]), [], 'invalid dates should be ignored safely');
const boundaryAlerts = getCadenceAlerts([{ date: '2026-01-01' }, { date: '2026-01-08' }], 7);
assert.equal(boundaryAlerts.length, 1, 'exact threshold boundary should alert');

assert.deepEqual(getSeriesDrift([]), { drift: 0, confidence: 0 }, 'empty series should return zero drift/confidence');
assert.deepEqual(getSeriesDrift([{ value: 10, confidence: 0.8 }, { value: 12 }, { value: 17, confidence: '0.6' }]), { drift: 7, confidence: 0.7 }, 'mixed confidence values should average numeric values only');

const provenance = buildMetricProvenance({ source: ' API ', method: ' Manual ', capturedAt: '2026-02-03' });
assert.equal(provenance.source, 'api');
assert.equal(provenance.method, 'manual');
assert.ok(provenance.capturedAt?.startsWith('2026-02-03'));
assert.equal(buildMetricProvenance({}, 'Fallback SRC').source, 'fallback src', 'fallback source should normalize');

const phase4 = { notes: 'keep me', confidence: 0.9 };
const normalizedIssue = normalizeIssue({ title: '  Hello ', phase: '4', phase4 });
assert.equal(normalizedIssue.title, 'Hello');
assert.equal(normalizedIssue.phase, 4);
assert.deepEqual(normalizedIssue.phase4, phase4, 'phase-4 fields should be preserved');

for (const badPayload of [null, undefined, 5, 'x', true, []]) {
  assert.equal(validateEditorImport(badPayload), false, 'non-object payloads should be invalid');
  assert.deepEqual(
    normalizeEditorImport(badPayload),
    { content: {}, overrides: {}, meta: { invalid: true } },
    'normalizer should return safe fallback for non-object payloads',
  );
}

console.log('Analytics quality tests passed');
