import { secureStorage } from './secureStorage.js';
import { buildRenderCacheSignature } from '../state/cacheKey';

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function signaturesMatch(a, b) {
  return !!a
    && !!b
    && a.schemaVersion === b.schemaVersion
    && a.themeId === b.themeId
    && a.themeVersion === b.themeVersion
    && a.fontSignature === b.fontSignature
    && a.exportProfileVersion === b.exportProfileVersion;
}

export function invalidateRenderCachesIfNeeded({
  storage,
  signatureKey,
  measurementCacheKey,
  rasterCacheKey,
  theme,
  fontConfig,
  exportProfile,
}) {
  const targetStorage = storage || secureStorage.raw;
  const nextSignature = buildRenderCacheSignature({ theme, fontConfig, exportProfile });
  const currentSignature = safeJsonParse(targetStorage.getItem(signatureKey));

  if (signaturesMatch(currentSignature, nextSignature)) {
    return { invalidated: false, signature: nextSignature };
  }

  if (measurementCacheKey) targetStorage.removeItem(measurementCacheKey);
  if (rasterCacheKey) targetStorage.removeItem(rasterCacheKey);
  targetStorage.setItem(signatureKey, JSON.stringify(nextSignature));

  return { invalidated: true, signature: nextSignature, previousSignature: currentSignature };
}
