import { createExportWorkerPayload, EXPORT_WORKER_MESSAGE_TYPES, isWorkerProgressMessage } from './exportWorkerContract';

function supportsWorkerExport() {
  return typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined' && typeof ImageBitmap !== 'undefined';
}

function drawBitmapToCanvas(bitmap, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width * 2;
  canvas.height = height * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas rendering unavailable');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close?.();
  return canvas;
}

export async function renderSceneWithWorkerAdapter({ sceneModel, contract, onProgress, mainThreadRenderer }) {
  if (!supportsWorkerExport()) {
    return mainThreadRenderer(sceneModel, contract);
  }
  const payload = createExportWorkerPayload({ sceneModel, contract });
  try {
    const worker = new Worker(new URL('./exportRaster.worker.js', import.meta.url), { type: 'module' });
    const result = await new Promise((resolve, reject) => {
      worker.onmessage = (event) => {
        const message = event?.data || {};
        if (isWorkerProgressMessage(message)) {
          onProgress?.(message);
          return;
        }
        if (message.type === EXPORT_WORKER_MESSAGE_TYPES.COMPLETE) {
          resolve(message.bitmap);
          return;
        }
        if (message.type === EXPORT_WORKER_MESSAGE_TYPES.ERROR) {
          reject(new Error(message?.error?.message || 'Worker export failed'));
        }
      };
      worker.onerror = () => reject(new Error('Worker execution failed'));
      worker.postMessage({ type: EXPORT_WORKER_MESSAGE_TYPES.START, payload });
    });
    worker.terminate();
    return drawBitmapToCanvas(result, contract.dimensions.width, contract.dimensions.height);
  } catch (_error) {
    return mainThreadRenderer(sceneModel, contract);
  }
}
