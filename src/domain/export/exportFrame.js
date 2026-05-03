import { createExportContract } from './contracts';

export async function exportFrame({ contractInput, sceneModel, sceneRenderer, domFallbackRenderer, preflightResult = null }) {
  const contract = createExportContract(contractInput);
  const exportMetadata = {
    preflight: preflightResult,
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
