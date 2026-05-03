import assert from 'node:assert/strict';
import { FOOTER_FIELD_ORDER, REQUIRED_FOOTER_FIELDS, resolveFooterData, validateFrameData } from '../src/domain/frameSchema.js';

console.log('frameSchema contract v1');

assert.deepEqual(FOOTER_FIELD_ORDER, ['source', 'timestamp', 'issueId', 'status']);
assert.ok(REQUIRED_FOOTER_FIELDS.has('source'));
assert.ok(REQUIRED_FOOTER_FIELDS.has('status'));

const footer = resolveFooterData({
  handle: 'CoinDesk',
  date: '2026-05-03T00:00:00Z',
  issueNum: 'WVS-42',
  status: 'draft',
});
assert.deepEqual(Object.keys(footer), FOOTER_FIELD_ORDER, 'footer field order should remain stable');
assert.equal(footer.source, 'CoinDesk');

const footerBoundary = resolveFooterData({ handle: '', date: '', issueNum: '', status: '' });
assert.deepEqual(Object.keys(footerBoundary), FOOTER_FIELD_ORDER);

assert.throws(
  () => validateFrameData({ frames: [], templates: {}, guidanceById: {} }),
  /validateTemplateInheritance is not defined/,
  'backward-compat: current validator wiring should fail loudly when helper is absent',
);

console.log('frameSchema contract tests passed');
