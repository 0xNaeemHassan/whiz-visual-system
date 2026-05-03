const CACHE_KEY_VERSION = 1;

function safeString(value, fallback = 'unknown') {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

function stableSerialize(value) {
  if (Array.isArray(value)) return value.map(stableSerialize);
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = stableSerialize(value[key]);
        return acc;
      }, {});
  }
  return value;
}

export function buildFontSignature(fontConfig) {
  if (!fontConfig) return 'default-fonts';
  try {
    return JSON.stringify(stableSerialize(fontConfig));
  } catch {
    return safeString(fontConfig, 'default-fonts');
  }
}

export function buildRenderCacheSignature({ theme, fontConfig, exportProfile }) {
  const themeId = safeString(theme?.id || theme?.name, 'theme-default');
  const themeVersion = safeString(theme?.version, 'v0');
  const fontSignature = buildFontSignature(fontConfig);
  const exportProfileVersion = safeString(exportProfile?.version, 'v0');

  return {
    schemaVersion: CACHE_KEY_VERSION,
    themeId,
    themeVersion,
    fontSignature,
    exportProfileVersion,
  };
}

export function buildRenderCacheKey(prefix, context) {
  const scope = safeString(prefix, 'render-cache');
  const signature = buildRenderCacheSignature(context);
  return `${scope}::${signature.themeId}@${signature.themeVersion}::font:${signature.fontSignature}::profile:${signature.exportProfileVersion}`;
}
