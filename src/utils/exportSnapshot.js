const SNAPSHOT_SCHEMA_VERSION = '1.0.0';

function stableSortValue(value) {
  if (Array.isArray(value)) return value.map(stableSortValue);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((acc, key) => {
      const v = value[key];
      if (typeof v === 'undefined') return acc;
      acc[key] = stableSortValue(v);
      return acc;
    }, {});
  }
  return value;
}

function fnv1aHash(input = '') {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function buildCanonicalDatasetPayload({ frameId, theme, content, overrides, aspectRatio, bgGradient, patternOverlay }) {
  return stableSortValue({ frameId, theme, content, overrides, aspectRatio, bgGradient, patternOverlay });
}

export function createDatasetSnapshot(input) {
  const payload = buildCanonicalDatasetPayload(input);
  const serialized = JSON.stringify(payload);
  const hash = fnv1aHash(serialized);
  return {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    hash,
    snapshotId: `${SNAPSHOT_SCHEMA_VERSION}:${hash}`,
    serialized,
    payload,
  };
}

export function buildCanonicalExportAttemptPayload({
  theme,
  overrides,
  normalizedContent,
  contract,
  outputMetadata,
}) {
  return stableSortValue({
    theme,
    overrides,
    normalizedContent,
    contract,
    outputMetadata,
  });
}

export function createExportAttemptSnapshot(input) {
  const payload = buildCanonicalExportAttemptPayload(input);
  const serialized = JSON.stringify(payload);
  const hash = fnv1aHash(serialized);
  return {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    hash,
    snapshotId: `${SNAPSHOT_SCHEMA_VERSION}:${hash}`,
    serialized,
    payload,
  };
}

function buildFieldDiff(field, beforePayload = {}, afterPayload = {}) {
  const before = stableSortValue(beforePayload[field]);
  const after = stableSortValue(afterPayload[field]);
  const beforeSerialized = JSON.stringify(before ?? null);
  const afterSerialized = JSON.stringify(after ?? null);
  return {
    changed: beforeSerialized !== afterSerialized,
    before,
    after,
    beforeHash: fnv1aHash(beforeSerialized),
    afterHash: fnv1aHash(afterSerialized),
  };
}

export function diffCanonicalSnapshots(preSnapshot, postSnapshot) {
  const fields = ['theme', 'overrides', 'normalizedContent', 'contract', 'outputMetadata'];
  const fieldDiffs = fields.reduce((acc, field) => {
    acc[field] = buildFieldDiff(field, preSnapshot?.payload, postSnapshot?.payload);
    return acc;
  }, {});
  const changedFields = fields.filter((field) => fieldDiffs[field].changed);
  return {
    comparable: Boolean(preSnapshot && postSnapshot),
    stable: changedFields.length === 0,
    changedFields,
    fieldDiffs,
    preSnapshotId: preSnapshot?.snapshotId || null,
    postSnapshotId: postSnapshot?.snapshotId || null,
  };
}

export { SNAPSHOT_SCHEMA_VERSION };
