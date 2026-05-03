import assert from 'node:assert/strict';
import { shouldBlockStrictExportForUnsnapshottedEdits } from '../src/domain/export/exportGuards.js';

console.log('exportGuards contract v1');

assert.equal(shouldBlockStrictExportForUnsnapshottedEdits({ strictMode: true, isSnapshotLockCurrent: false, action: 'export' }), true);
assert.equal(shouldBlockStrictExportForUnsnapshottedEdits({ strictMode: true, isSnapshotLockCurrent: false, action: 'publish' }), true);
assert.equal(shouldBlockStrictExportForUnsnapshottedEdits({ strictMode: true, isSnapshotLockCurrent: true, action: 'export' }), false);
assert.equal(shouldBlockStrictExportForUnsnapshottedEdits({ strictMode: false, isSnapshotLockCurrent: false, action: 'export' }), false);
assert.equal(shouldBlockStrictExportForUnsnapshottedEdits({ strictMode: true, isSnapshotLockCurrent: false, action: 'preview' }), false);
assert.equal(shouldBlockStrictExportForUnsnapshottedEdits({ strictMode: true, isSnapshotLockCurrent: false, action: 'export', guardEnabled: false }), false);

console.log('exportGuards contract tests passed');
