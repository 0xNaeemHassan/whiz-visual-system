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

export { SNAPSHOT_SCHEMA_VERSION };
