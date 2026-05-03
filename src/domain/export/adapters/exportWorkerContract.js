export const EXPORT_WORKER_MESSAGE_TYPES = Object.freeze({
  START: 'export/start',
  PROGRESS: 'export/progress',
  COMPLETE: 'export/complete',
  ERROR: 'export/error',
});

export function createExportWorkerPayload({ sceneModel, contract }) {
  return {
    schema: 'whiz.export.worker/1',
    scene: normalizeSceneModel(sceneModel),
    contract: normalizeContract(contract),
  };
}

function normalizeContract(contract = {}) {
  const width = Number(contract?.dimensions?.width) || 0;
  const height = Number(contract?.dimensions?.height) || 0;
  return {
    ...contract,
    dimensions: { width, height },
    quality: Number.isFinite(contract?.quality) ? Math.max(0, Math.min(1, contract.quality)) : 0.92,
    locale: contract?.locale || 'en-US',
    citationMode: contract?.citationMode || 'off',
  };
}

function normalizeSceneModel(sceneModel = {}) {
  return JSON.parse(JSON.stringify(sceneModel));
}

export function isWorkerProgressMessage(message = {}) {
  return message?.type === EXPORT_WORKER_MESSAGE_TYPES.PROGRESS;
}
