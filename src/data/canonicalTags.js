export const CANONICAL_TAGS = Object.freeze([
  'defi',
  'yield',
  'risk',
  'stablecoin',
  'macro',
  'analytics',
  'governance',
  'security',
  'comparison',
  'education',
]);

export const TAG_ALIAS_MAP = Object.freeze({
  "de-fi": "defi",
  de_fi: "defi",
  defi: 'defi',
  apy: 'yield',
  apr: 'yield',
  returns: 'yield',
  safety: 'risk',
  threat: 'risk',
  stables: 'stablecoin',
  stable: 'stablecoin',
  econ: 'macro',
  token: 'governance',
  gov: 'governance',
  sec: 'security',
  compare: 'comparison',
  explainers: 'education',
});

export const TAG_DEPRECATION_MAP = Object.freeze({
  alpha: 'analytics',
  postmortem: 'risk',
  "post-mortem": "risk",
  tokenomics: 'governance',
  tutorial: 'education',
});

const TAG_TOKEN_RE = /[^a-z0-9-]/g;
const MULTI_DASH_RE = /-+/g;

const sanitizeTagToken = (value = '') => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/\s+/g, '-')
  .replace(TAG_TOKEN_RE, '')
  .replace(MULTI_DASH_RE, '-')
  .replace(/^-|-$/g, '');

export function normalizeCanonicalTag(tag = '') {
  const raw = sanitizeTagToken(tag);
  if (!raw) return { input: tag, normalized: '', valid: false, deprecatedFrom: null, aliasFrom: null };
  const aliasResolved = TAG_ALIAS_MAP[raw] || raw;
  const deprecatedResolved = TAG_DEPRECATION_MAP[aliasResolved];
  const normalized = deprecatedResolved || aliasResolved;
  return {
    input: tag,
    normalized,
    valid: CANONICAL_TAGS.includes(normalized),
    deprecatedFrom: deprecatedResolved ? aliasResolved : null,
    aliasFrom: aliasResolved !== raw ? raw : null,
  };
}

export function normalizeCanonicalTagList(input = []) {
  const parsed = Array.isArray(input)
    ? input
    : String(input || '').split(',').map((token) => token.trim()).filter(Boolean);
  const normalizedEntries = parsed.map((tag) => normalizeCanonicalTag(tag));
  const valid = [];
  const invalid = [];
  const remapped = [];
  normalizedEntries.forEach((entry) => {
    if (!entry.valid) {
      invalid.push(entry.input);
      return;
    }
    if (entry.aliasFrom || entry.deprecatedFrom) remapped.push(entry);
    if (!valid.includes(entry.normalized)) valid.push(entry.normalized);
  });
  return { valid, invalid, remapped, normalizedEntries };
}
