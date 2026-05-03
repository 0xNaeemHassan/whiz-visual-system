const ADAPTER_CONFIG_PLACEHOLDER = 'set-in-local-config-only';

export function createAdapterCredentials({ tokenEnvKey, tokenValue } = {}) {
  const token = String(tokenValue || '').trim();
  return {
    tokenEnvKey,
    token: token || ADAPTER_CONFIG_PLACEHOLDER,
    isConfigured: Boolean(token),
  };
}

export function ensureAdapterPayloadContext(context = {}) {
  return {
    issueNumber: Number(context.issueNumber) || null,
    tags: Array.isArray(context.tags) ? context.tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
    sources: Array.isArray(context.sources) ? context.sources.map(normalizeSource).filter(Boolean) : [],
    coverAsset: normalizeCoverAsset(context.coverAsset),
    canonicalSlug: String(context.canonicalSlug || '').trim(),
  };
}

function normalizeSource(source) {
  if (!source) return null;
  if (typeof source === 'string') return { label: source, url: null };
  const label = String(source.label || source.title || '').trim();
  const url = String(source.url || '').trim() || null;
  if (!label && !url) return null;
  return { label: label || url, url };
}

function normalizeCoverAsset(asset) {
  if (!asset || typeof asset !== 'object') return null;
  const url = String(asset.url || '').trim();
  if (!url) return null;
  return {
    url,
    alt: String(asset.alt || '').trim() || null,
    credit: String(asset.credit || '').trim() || null,
  };
}

export function createOfflineResult({ adapterId, context, payload }) {
  return {
    adapterId,
    status: 'offline-fallback',
    reason: 'Adapter token is not configured. Returning offline package.',
    context,
    payload,
  };
}
