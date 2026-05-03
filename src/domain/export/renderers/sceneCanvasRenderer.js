import { FRAMES } from '../../../data/frames';

const SCENE_SUPPORTED_LAYOUTS = new Set(['editorial']);

function resolveFrameLayout(frameId) {
  const id = Number(frameId);
  if (!Number.isFinite(id)) return null;
  return FRAMES.find((frame) => frame.id === id)?.layout || null;
}

function parseGradientStops(stopString) {
  return stopString
    .split(/,(?![^()]*\))/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((stop) => stop.split(/\s+/)[0]);
}

function paintBackground(ctx, sceneModel, contract, width, height) {
  const gradientValue = sceneModel.background?.gradient;
  if (gradientValue && /^linear-gradient\(/i.test(gradientValue)) {
    const gradientBody = gradientValue.slice(16, -1);
    const parts = gradientBody.split(/,(?![^()]*\))/).map((part) => part.trim());
    const hasAngle = /deg$/.test(parts[0]);
    const rawStops = hasAngle ? parts.slice(1) : parts;
    const colors = parseGradientStops(rawStops.join(','));

    if (colors.length >= 2) {
      const angle = hasAngle ? Number.parseFloat(parts[0]) : 180;
      const radians = ((angle - 90) * Math.PI) / 180;
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.abs(width * Math.cos(radians)) / 2 + Math.abs(height * Math.sin(radians)) / 2;
      const x0 = cx - Math.cos(radians) * dist;
      const y0 = cy - Math.sin(radians) * dist;
      const x1 = cx + Math.cos(radians) * dist;
      const y1 = cy + Math.sin(radians) * dist;
      const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
      const denom = Math.max(colors.length - 1, 1);
      colors.forEach((color, index) => gradient.addColorStop(index / denom, color));
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      return;
    }
  }

  ctx.fillStyle = contract.background || sceneModel.background.solid;
  ctx.fillRect(0, 0, width, height);
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

export async function renderSceneToCanvas(sceneModel, contract) {
  const layout = resolveFrameLayout(sceneModel.frameId);
  if (!SCENE_SUPPORTED_LAYOUTS.has(layout)) {
    throw new Error(`Scene renderer does not support frame ${sceneModel.frameId} (${layout || 'unknown'} layout)`);
  }

  const scale = 2;
  const { width, height } = sceneModel.dimensions;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas rendering unavailable');
  ctx.scale(scale, scale);

  paintBackground(ctx, sceneModel, contract, width, height);

  ctx.fillStyle = sceneModel.palette.accent;
  ctx.fillRect(0, 0, 4, height);

  ctx.fillStyle = sceneModel.palette.textSecondary;
  ctx.font = '600 10px "JetBrains Mono", monospace';
  const localizedIssueNum = new Intl.NumberFormat(sceneModel.locale || 'en-US', { minimumIntegerDigits: 3, useGrouping: false }).format(Number(sceneModel.content.issueNum) || 0);
  ctx.fillText(`#${localizedIssueNum} · ${sceneModel.content.topicTag}`, 24, 32);

  ctx.fillStyle = sceneModel.palette.textPrimary;
  ctx.font = `700 ${sceneModel.typography.titleSize}px "Space Grotesk", sans-serif`;
  wrapText(ctx, sceneModel.content.title, 44, 120, width - 88, sceneModel.typography.titleSize * 1.05, 3);

  ctx.fillStyle = sceneModel.palette.textSecondary;
  ctx.font = `400 ${sceneModel.typography.deckSize}px Inter, sans-serif`;
  wrapText(ctx, sceneModel.content.deck, 44, 320, width - 88, sceneModel.typography.deckSize * 1.45, 3);

  ctx.fillStyle = sceneModel.palette.body;
  ctx.font = `400 ${sceneModel.typography.bodySize}px Inter, sans-serif`;
  wrapText(ctx, sceneModel.content.body, 44, 420, width - 88, sceneModel.typography.bodySize * 1.7, 10);

  ctx.fillStyle = sceneModel.palette.accent;
  ctx.font = '500 12px "JetBrains Mono", monospace';
  ctx.fillText(sceneModel.content.handle, 44, height - 30);

  return canvas;
}
