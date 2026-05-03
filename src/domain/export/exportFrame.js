import { createExportContract } from './contracts';
import { createExportAttemptSnapshot, diffCanonicalSnapshots } from '../../utils/exportSnapshot';

export async function exportFrame({
  contractInput,
  sceneModel,
  sceneRenderer,
  domFallbackRenderer,
  preflightResult = null,
  snapshotInput = null,
  strictSnapshotStability = false,
}) {
  const contract = createExportContract(contractInput);
  const preSnapshot = snapshotInput ? createExportAttemptSnapshot({ ...snapshotInput, contract }) : null;
  const exportMetadata = {
    preflight: preflightResult,
    citationMode: contract.citationMode || 'off',
    exportedAt: new Date().toISOString(),
  };

  const finalizeDiagnostics = (attemptMetadata = {}) => {
    const postSnapshot = snapshotInput ? createExportAttemptSnapshot({ ...snapshotInput, contract, outputMetadata: attemptMetadata }) : null;
    const snapshotDiff = preSnapshot && postSnapshot ? diffCanonicalSnapshots(preSnapshot, postSnapshot) : null;
    if (strictSnapshotStability && snapshotDiff && !snapshotDiff.stable) {
      const changed = snapshotDiff.changedFields.join(', ');
      throw new Error(`Strict export blocked: unstable snapshot delta detected (${changed}).`);
    }
    return {
      ...exportMetadata,
      diagnostics: {
        snapshotDiff,
      },
    };
  };
  try {
    const canvas = await sceneRenderer(sceneModel, contract);
    return { canvas, contract, usedFallback: false, exportMetadata: finalizeDiagnostics({ usedFallback: false }) };
  } catch (error) {
    if (!domFallbackRenderer) throw error;
    const canvas = await domFallbackRenderer(contract, error);
    return {
      canvas,
      contract,
      usedFallback: true,
      fallbackReason: error?.message || 'scene renderer failed',
      exportMetadata: finalizeDiagnostics({ usedFallback: true, fallbackReason: error?.message || 'scene renderer failed' }),
    };
  }
}
