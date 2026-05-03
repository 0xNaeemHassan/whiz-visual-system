import { createExportContract } from './contracts';
import { resolveExportProfile } from './exportProfileResolver';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function exportFrame({ contractInput, sceneModel, sceneRenderer, simplifiedSceneRenderer = null, domFallbackRenderer, preflightResult = null, profileContext = {} }) {
  const resolvedProfile = resolveExportProfile({
    deviceClass: profileContext.deviceClass,
    performanceTier: profileContext.performanceTier,
    baseDimensions: contractInput?.dimensions,
    format: contractInput?.format,
  });

  const contract = createExportContract({
    ...contractInput,
    dimensions: resolvedProfile.targetDimensions,
    quality: contractInput?.quality ?? resolvedProfile.quality,
  });

  const exportMetadata = {
    preflight: preflightResult,
    citationMode: contract.citationMode || 'off',
    exportedAt: new Date().toISOString(),
    exportProfileDecision: resolvedProfile,
  };

  const attempts = Math.max(1, Number(resolvedProfile.retryPolicy?.attempts || 1));
  const backoffMs = Math.max(0, Number(resolvedProfile.retryPolicy?.backoffMs || 0));

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const canvas = await sceneRenderer(sceneModel, { ...contract, effects: resolvedProfile.effectToggles });
      return { canvas, contract, usedFallback: false, rendererUsed: 'primary-renderer', exportMetadata };
    } catch (primaryError) {
      if (simplifiedSceneRenderer) {
        try {
          const canvas = await simplifiedSceneRenderer(sceneModel, { ...contract, quality: Math.min(contract.quality, 0.85), effects: { shadows: false, gradients: true, textures: false } });
          return { canvas, contract, usedFallback: true, rendererUsed: 'simplified-renderer', fallbackReason: primaryError?.message || 'primary renderer failed', exportMetadata };
        } catch {}
      }

      if (attempt < attempts) {
        await wait(backoffMs);
        continue;
      }

      if (!domFallbackRenderer) throw primaryError;
      const canvas = await domFallbackRenderer(contract, primaryError);
      return { canvas, contract, usedFallback: true, rendererUsed: 'dom-snapshot-fallback', fallbackReason: primaryError?.message || 'scene renderer failed', exportMetadata };
    }
  }

  throw new Error('Export failed without renderer result');
}
