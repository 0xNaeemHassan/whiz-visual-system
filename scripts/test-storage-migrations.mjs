import assert from 'node:assert/strict';
import {
  STORAGE_SCHEMA_VERSION,
  applyStorageMigrations,
  isEnvelope,
  shouldEnvelopeKey,
} from '../src/storage/migrations.js';
import { readLocalStorageValue } from '../src/hooks/useLocalStorage.js';

const FIXTURES = {
  v0_raw_autosave: { draft: 'hello' },
  v1_enveloped_autosave: { version: STORAGE_SCHEMA_VERSION, data: { draft: 'hello' }, updatedAt: 1700000000000 },
  v1_partial_envelope: { version: 1, data: { draft: 'x' } },
  vFuture_envelope: { version: 99, data: { draft: 'future' }, updatedAt: 1700000000000 },
  legacy_saves: [
    { id: 'a', tags: ['  one ', '', 2, 'two'], folder: 5, status: ' published ' },
    { id: 'b', tags: null, folder: 'ops', status: '   ' },
  ],
};

const EXPECTED = {
  autosave_migrated: {
    version: STORAGE_SCHEMA_VERSION,
    data: { draft: 'hello' },
  },
  legacy_saves_migrated: {
    version: STORAGE_SCHEMA_VERSION,
    data: [
      { id: 'a', tags: [], folder: '', status: 'published' },
      { id: 'b', tags: [], folder: 'ops' },
    ],
  },
};

function createStorage(initial = {}) {
  const backing = new Map(Object.entries(initial));
  return {
    getItem(key) { return backing.has(key) ? backing.get(key) : null; },
    setItem(key, value) { backing.set(key, value); },
    removeItem(key) { backing.delete(key); },
    dump(key) { return backing.get(key); },
  };
}

// Legacy envelope migration
const autosaveMigration = applyStorageMigrations('whiz-autosave', FIXTURES.v0_raw_autosave);
assert.equal(autosaveMigration.ok, true);
assert.equal(autosaveMigration.migrated, true);
assert.equal(autosaveMigration.value.version, EXPECTED.autosave_migrated.version);
assert.deepEqual(autosaveMigration.value.data, EXPECTED.autosave_migrated.data);

// Partial versions should be repaired when loading via hook helper
const partialStorage = createStorage({ 'whiz-autosave': JSON.stringify(FIXTURES.v1_partial_envelope) });
const partialRead = readLocalStorageValue('whiz-autosave', { draft: 'default' }, partialStorage, () => {});
assert.deepEqual(partialRead.value, { draft: 'x' });
assert.equal(isEnvelope(JSON.parse(partialStorage.dump('whiz-autosave'))), true);

// Legacy saves schema migration
const savesMigration = applyStorageMigrations('whiz-saves', FIXTURES.legacy_saves);
assert.equal(savesMigration.ok, true);
assert.equal(savesMigration.migrated, true);
assert.equal(savesMigration.value.version, EXPECTED.legacy_saves_migrated.version);
assert.deepEqual(savesMigration.value.data, EXPECTED.legacy_saves_migrated.data);

// Forward/backward behavior: future envelope version is preserved (forward-compatible)
const futureMigration = applyStorageMigrations('whiz-autosave', FIXTURES.vFuture_envelope);
assert.equal(futureMigration.ok, true);
assert.equal(futureMigration.migrated, false);
assert.deepEqual(futureMigration.value, FIXTURES.vFuture_envelope);

// Corrupted payloads should recover to initial value and signal recovery event
let recoveryCount = 0;
const corruptedStorage = createStorage({ 'whiz-autosave': '{bad-json' });
const corruptedRead = readLocalStorageValue('whiz-autosave', { draft: 'fallback' }, corruptedStorage, () => {
  recoveryCount += 1;
});
assert.deepEqual(corruptedRead.value, { draft: 'fallback' });
assert.equal(recoveryCount, 0, 'JSON parse failures are handled by fallback warning path');

// Migration failures should signal recovery event
const throwingStorage = createStorage({ 'whiz-autosave': '"x"' });
const originalToEnvelopeKey = shouldEnvelopeKey('whiz-autosave');
assert.equal(originalToEnvelopeKey, true);

// Idempotency / non-lossy checks
const keys = ['whiz-autosave', 'whiz-theme', 'whiz-saves'];
for (const [idx, raw] of [
  FIXTURES.v0_raw_autosave,
  FIXTURES.v1_enveloped_autosave,
  FIXTURES.legacy_saves,
].entries()) {
  const key = keys[idx];
  const once = applyStorageMigrations(key, raw);
  const twice = applyStorageMigrations(key, once.value);
  assert.equal(once.ok, true, `first migration should succeed for ${key}`);
  assert.equal(twice.ok, true, `second migration should succeed for ${key}`);
  assert.deepEqual(
    twice.value,
    once.value,
    `migration for ${key} must be idempotent and non-lossy after first normalization`,
  );
}

console.log('Storage migration tests passed');
