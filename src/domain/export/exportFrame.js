import { createExportContract } from './contracts';

export async function exportFrame({ contractInput, sceneModel, sceneRenderer, domFallbackRenderer }) {
  const contract = createExportContract(contractInput);
  try {
    const canvas = await sceneRenderer(sceneModel, contract);
    return { canvas, contract, usedFallback: false, locale: contract.locale, exportSummary: { locale: contract.locale, renderer: 'scene' } };
  } catch (error) {
    if (!domFallbackRenderer) throw error;
    const canvas = await domFallbackRenderer(contract, error);
    return { canvas, contract, usedFallback: true, fallbackReason: error?.message || 'scene renderer failed', locale: contract.locale, exportSummary: { locale: contract.locale, renderer: 'dom-fallback' } };
  }
}
