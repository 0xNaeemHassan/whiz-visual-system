const EXPORT_PROFILE_MATRIX = Object.freeze({
  desktop: {
    high: { scale: 1, quality: 0.94, compression: 'low', effects: { shadows: true, gradients: true, textures: true }, retryPolicy: { attempts: 1, backoffMs: 0 } },
    medium: { scale: 1, quality: 0.9, compression: 'balanced', effects: { shadows: true, gradients: true, textures: false }, retryPolicy: { attempts: 2, backoffMs: 50 } },
    low: { scale: 0.9, quality: 0.84, compression: 'aggressive', effects: { shadows: false, gradients: true, textures: false }, retryPolicy: { attempts: 2, backoffMs: 100 } },
  },
  mobile: {
    high: { scale: 0.9, quality: 0.9, compression: 'balanced', effects: { shadows: true, gradients: true, textures: false }, retryPolicy: { attempts: 2, backoffMs: 50 } },
    medium: { scale: 0.82, quality: 0.86, compression: 'aggressive', effects: { shadows: false, gradients: true, textures: false }, retryPolicy: { attempts: 2, backoffMs: 100 } },
    low: { scale: 0.72, quality: 0.8, compression: 'aggressive', effects: { shadows: false, gradients: false, textures: false }, retryPolicy: { attempts: 3, backoffMs: 125 } },
  },
  default: {},
});

const RENDER_FALLBACK_CHAIN = Object.freeze(['primary-renderer', 'simplified-renderer', 'dom-snapshot-fallback']);

const normalize = (value, allowed, fallback) => (allowed.includes(String(value || '').toLowerCase()) ? String(value).toLowerCase() : fallback);

export function resolveExportProfile({ deviceClass = 'desktop', performanceTier = 'medium', baseDimensions = { width: 1200, height: 675 }, format = 'webp' } = {}) {
  const normalizedDevice = normalize(deviceClass, ['desktop', 'mobile'], 'desktop');
  const normalizedTier = normalize(performanceTier, ['high', 'medium', 'low'], 'medium');
  const profile = EXPORT_PROFILE_MATRIX[normalizedDevice][normalizedTier] || EXPORT_PROFILE_MATRIX.desktop.medium;
  const width = Math.max(1, Math.round((baseDimensions?.width || 1200) * profile.scale));
  const height = Math.max(1, Math.round((baseDimensions?.height || 675) * profile.scale));

  return {
    key: `${normalizedDevice}:${normalizedTier}:${format}`,
    deviceClass: normalizedDevice,
    performanceTier: normalizedTier,
    targetDimensions: { width, height },
    quality: profile.quality,
    compressionLevel: profile.compression,
    effectToggles: profile.effects,
    retryPolicy: profile.retryPolicy,
    rendererFallbackChain: RENDER_FALLBACK_CHAIN,
  };
}
