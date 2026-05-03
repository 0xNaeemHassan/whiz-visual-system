import { EXPORT_WORKER_MESSAGE_TYPES } from './exportWorkerContract';

self.onmessage = async (event) => {
  const message = event?.data || {};
  if (message?.type !== EXPORT_WORKER_MESSAGE_TYPES.START) return;
  try {
    const { payload } = message;
    self.postMessage({ type: EXPORT_WORKER_MESSAGE_TYPES.PROGRESS, progress: 0.1, stage: 'init' });
    const bitmap = await rasterizeScene(payload.scene, payload.contract);
    self.postMessage({ type: EXPORT_WORKER_MESSAGE_TYPES.PROGRESS, progress: 1, stage: 'done' });
    self.postMessage({ type: EXPORT_WORKER_MESSAGE_TYPES.COMPLETE, bitmap });
  } catch (error) {
    self.postMessage({ type: EXPORT_WORKER_MESSAGE_TYPES.ERROR, error: { message: error?.message || 'Worker export failed' } });
  }
};

async function rasterizeScene(sceneModel, contract) {
  const scale = 2;
  const width = sceneModel?.dimensions?.width || contract?.dimensions?.width;
  const height = sceneModel?.dimensions?.height || contract?.dimensions?.height;
  if (!width || !height) throw new Error('Invalid scene dimensions');
  const canvas = new OffscreenCanvas(width * scale, height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas rendering unavailable in worker');
  ctx.scale(scale, scale);
  ctx.fillStyle = contract?.background || sceneModel?.background?.solid || '#000';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = sceneModel?.palette?.accent || '#fff';
  ctx.fillRect(0, 0, 4, height);
  ctx.fillStyle = sceneModel?.palette?.textPrimary || '#fff';
  ctx.font = `700 ${sceneModel?.typography?.titleSize || 24}px sans-serif`;
  wrapText(ctx, sceneModel?.content?.title || '', 44, 120, width - 88, (sceneModel?.typography?.titleSize || 24) * 1.05, 3);
  return canvas.transferToImageBitmap();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = Infinity) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines) break;
    } else {
      line = test;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
}
