import { createExportContract } from './contracts';

export async function exportFrame({ contractInput, sceneModel, sceneRenderer, domFallbackRenderer, preflightResult = null }) {
  const contract = createExportContract(contractInput);
  const exportMetadata = {
    preflight: preflightResult,
    citationMode: contract.citationMode || 'off',
    layoutCost: sceneModel?.exportProfiling?.complexity || null,
    degradations: {
      disabledLayers: sceneModel?.exportProfiling?.disabledLayers || [],
      reduceEffectComplexity: Boolean(sceneModel?.exportProfiling?.reduceEffectComplexity),
      simplifyGradients: Boolean(sceneModel?.exportProfiling?.simplifyGradients),
      maxImageDrawSize: sceneModel?.exportProfiling?.maxImageDrawSize || null,
    },
    exportedAt: new Date().toISOString(),
  };
  try {
    const canvas = await sceneRenderer(sceneModel, contract);
    return { canvas, contract, usedFallback: false, exportMetadata };
  } catch (error) {
    if (!domFallbackRenderer) throw error;
    const canvas = await domFallbackRenderer(contract, error);
    return { canvas, contract, usedFallback: true, fallbackReason: error?.message || 'scene renderer failed', exportMetadata };
  }
}
