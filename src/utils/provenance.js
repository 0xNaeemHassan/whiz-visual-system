export const SOURCE_TYPE_VALUES = Object.freeze(['primary', 'secondary', 'derived', 'unknown']);

const LEGACY_SOURCE_TYPE_MAP = Object.freeze({
  first_party: 'primary',
  firsthand: 'primary',
  manual: 'primary',
  second_party: 'secondary',
  third_party: 'secondary',
  vendor: 'secondary',
  computed: 'derived',
  synthetic: 'derived',
  inferred: 'derived',
  n_a: 'unknown',
  na: 'unknown',
});

export function normalizeSourceType(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'unknown';
  if (SOURCE_TYPE_VALUES.includes(raw)) return raw;
  if (LEGACY_SOURCE_TYPE_MAP[raw]) return LEGACY_SOURCE_TYPE_MAP[raw];
  return 'unknown';
}

export function normalizeSourceAuthorityScore(value) {
  if (value == null || value === '') return undefined;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return undefined;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

export function normalizeProvenanceShape(value) {
  const base = value && typeof value === 'object' ? value : {};
  return {
    source: String(base.source || '').trim(),
    date: String(base.date || '').trim(),
    confidence: ['low', 'medium', 'high'].includes(String(base.confidence || '').toLowerCase()) ? String(base.confidence).toLowerCase() : 'medium',
    notes: String(base.notes || '').trim(),
    links: String(base.links || '').trim(),
    sourceType: normalizeSourceType(base.sourceType || base.trustClass || base.type),
    sourceAuthorityScore: normalizeSourceAuthorityScore(base.sourceAuthorityScore),
  };
}

export function getSourceTypeBadgeMeta(sourceType = 'unknown') {
  const normalized = normalizeSourceType(sourceType);
  const map = {
    primary: { tone: 'positive', label: 'Primary', tooltip: 'Primary: direct/original source material.' },
    secondary: { tone: 'warning', label: 'Secondary', tooltip: 'Secondary: interpreted or reported by another source.' },
    derived: { tone: 'info', label: 'Derived', tooltip: 'Derived: transformed or calculated from source data.' },
    unknown: { tone: 'default', label: 'Unknown', tooltip: 'Unknown: trust class is not yet defined.' },
  };
  return map[normalized] || map.unknown;
}
