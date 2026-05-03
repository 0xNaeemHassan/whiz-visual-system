import assert from 'node:assert/strict';
import { runExportPreflight } from '../src/domain/services/complianceService.js';
import { shouldBlockStrictExportForUnsnapshottedEdits } from '../src/domain/export/exportGuards.js';

const pass = runExportPreflight({
  content: { topicTag: 'DEFI', tickerSpeed: 24, stats: [{ label: 'TVL', value: '$1B' }] },
  overrides: { frameBg: '#0F1318', title: { color: '#F4F5F7', fontSize: 52 }, deck: { fontSize: 18 }, body: { fontSize: 15 } },
  theme: { base: '#0F1318' },
  whizEffects: { glow: false, noise: false },
});
assert.equal(pass.passed, true);

const fail = runExportPreflight({
  content: { topicTag: '', tickerSpeed: 48, stats: [{ label: '', value: '$1B' }] },
  overrides: { frameBg: '#111111', title: { color: '#222222', fontSize: 10 }, deck: { fontSize: 11 }, body: { fontSize: 11 } },
  theme: { base: '#111111' },
  whizEffects: { glow: true, noise: true },
});
assert.equal(fail.passed, false);
assert.ok(fail.criticalFailures.length >= 1);
assert.ok(fail.hasWarnings, true);

assert.equal(
  shouldBlockStrictExportForUnsnapshottedEdits({ strictMode: true, isSnapshotLockCurrent: false, action: 'export' }),
  true,
);
assert.equal(
  shouldBlockStrictExportForUnsnapshottedEdits({ strictMode: true, isSnapshotLockCurrent: true, action: 'publish' }),
  false,
);

console.log('Export preflight tests passed');
