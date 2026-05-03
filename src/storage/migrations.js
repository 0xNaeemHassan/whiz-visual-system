import { repairDuplicateIssueNumbers } from './issueNumberAllocator';

const STORAGE_SCHEMA_VERSION = 1;

const ENVELOPED_KEYS = new Set([
  'whiz-autosave',
  'whiz-theme',
]);

const EDITOR_SNAPSHOT_PATTERNS = [/^whiz-saves$/, /^whiz-autosave$/, /^whiz-editor-snapshot/, /^whiz-snapshot/];

function isObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function isEnvelope(value) {
  return isObject(value) && typeof value.version === 'number' && 'data' in value && typeof value.updatedAt === 'number';
}

export function shouldEnvelopeKey(key) {
  return ENVELOPED_KEYS.has(key) || EDITOR_SNAPSHOT_PATTERNS.some((re) => re.test(key));
}

export function toEnvelope(data, version = STORAGE_SCHEMA_VERSION) {
  return { version, data, updatedAt: Date.now() };
}

function migrateAnyToEnvelope(rawValue) {
  if (isEnvelope(rawValue)) return rawValue;
  if (isObject(rawValue) && typeof rawValue.version === 'number' && 'data' in rawValue) {
    return {
      ...rawValue,
      updatedAt: typeof rawValue.updatedAt === 'number' ? rawValue.updatedAt : Date.now(),
    };
  }
  return toEnvelope(rawValue, STORAGE_SCHEMA_VERSION);
}

function migrateLegacySaveRecord(save) {
  if (!isObject(save)) return save;
  const { status: legacyStatus, ...rest } = save;
  const legacyTags = Array.isArray(save.tags)
    ? save.tags.filter((tag) => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean)
    : [];
  const tags = normalizeCanonicalTagList(legacyTags).valid;
  const folder = typeof save.folder === 'string' ? save.folder : '';
  const status = typeof legacyStatus === 'string' && legacyStatus.trim() ? legacyStatus.trim() : undefined;
  return {
    ...rest,
    tags,
    folder,
    ...(status ? { status } : {}),
  };
}

function migrateLegacySaves(rawValue) {
  const enveloped = migrateAnyToEnvelope(rawValue);
  if (!Array.isArray(enveloped.data)) return enveloped;
  return {
    ...enveloped,
    data: enveloped.data.map(migrateLegacySaveRecord),
  };
}

function migratePlannerIssues(rawValue) {
  const enveloped = migrateAnyToEnvelope(rawValue);
  if (!Array.isArray(enveloped.data)) return enveloped;
  const repaired = repairDuplicateIssueNumbers(enveloped.data);
  return {
    ...enveloped,
    data: repaired.items,
    metadata: {
      ...(isObject(enveloped.metadata) ? enveloped.metadata : {}),
      ...(isObject(repaired.metadata) ? repaired.metadata : {}),
    },
  };
}

const MIGRATIONS = {
  'whiz-autosave': [migrateAnyToEnvelope],
  'whiz-theme': [migrateAnyToEnvelope],
  // Applies to legacy or ad-hoc snapshot keys too.
  'whiz-saves': [migrateLegacySaves],
  'whiz-issues': [migratePlannerIssues],
};

function getMigrationChain(key) {
  if (MIGRATIONS[key]) return MIGRATIONS[key];
  if (EDITOR_SNAPSHOT_PATTERNS.some((re) => re.test(key))) return [migrateAnyToEnvelope];
  return [];
}

export function applyStorageMigrations(key, parsedValue) {
  const chain = getMigrationChain(key);
  if (!chain.length) {
    return { ok: true, value: parsedValue, migrated: false };
  }

  try {
    let next = parsedValue;
    let migrated = false;
    for (const migration of chain) {
      const before = next;
      next = migration(next);
      if (next !== before) migrated = true;
    }
    return { ok: true, value: next, migrated };
  } catch (error) {
    return { ok: false, error, migrated: false };
  }
}

export { STORAGE_SCHEMA_VERSION };
