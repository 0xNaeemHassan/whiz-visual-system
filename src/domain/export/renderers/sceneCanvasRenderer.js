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
  const scale = 2;
  const { width, height } = sceneModel.dimensions;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas rendering unavailable');
  ctx.scale(scale, scale);

  ctx.fillStyle = contract.background || sceneModel.background.solid;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = sceneModel.palette.accent;
  ctx.fillRect(0, 0, 4, height);

  ctx.fillStyle = sceneModel.palette.textSecondary;
  ctx.font = '600 10px "JetBrains Mono", monospace';
  ctx.fillText(`#${String(sceneModel.content.issueNum).padStart(3, '0')} · ${sceneModel.content.topicTag}`, 24, 32);

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
