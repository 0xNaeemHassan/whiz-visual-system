const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function getLayoutTuning(content = {}) {
  const density = clamp(Number(content.layoutDensity ?? 0.6), 0.35, 1.4);
  const spacing = clamp(Number(content.layoutSpacing ?? 0.6), 0.35, 1.4);
  return { density, spacing };
}

export function hasOverlap(a, b, minGap = 0) {
  return !(
    a.x + a.width + minGap <= b.x ||
    b.x + b.width + minGap <= a.x ||
    a.y + a.height + minGap <= b.y ||
    b.y + b.height + minGap <= a.y
  );
}

export function ensureMinEdgeSpacing(point, bounds, minEdgePadding = 8) {
  return {
    ...point,
    x: clamp(point.x, bounds.left + minEdgePadding, bounds.right - minEdgePadding),
    y: clamp(point.y, bounds.top + minEdgePadding, bounds.bottom - minEdgePadding),
  };
}

export function placeNodes({
  nodes,
  bounds,
  nodeSize,
  edgePadding = 12,
  minNodeGap = 8,
  maxPasses = 12,
}) {
  const placed = [];
  nodes.forEach((node, i) => {
    const width = typeof nodeSize === 'function' ? nodeSize(node).width : nodeSize.width;
    const height = typeof nodeSize === 'function' ? nodeSize(node).height : nodeSize.height;
    const fallback = {
      x: bounds.left + ((i + 1) * (bounds.right - bounds.left)) / (nodes.length + 1),
      y: bounds.top + ((i + 1) * (bounds.bottom - bounds.top)) / (nodes.length + 1),
    };
    let candidate = ensureMinEdgeSpacing({
      x: Number(node.x ?? fallback.x),
      y: Number(node.y ?? fallback.y),
    }, bounds, edgePadding);

    let attempt = 0;
    while (attempt < maxPasses) {
      const candidateRect = { x: candidate.x - width / 2, y: candidate.y - height / 2, width, height };
      const collision = placed.find((existing) => hasOverlap(candidateRect, existing.rect, minNodeGap));
      if (!collision) break;
      candidate = ensureMinEdgeSpacing({
        x: candidate.x + (attempt % 2 === 0 ? 12 : -10),
        y: candidate.y + (attempt % 3 === 0 ? 10 : -8),
      }, bounds, edgePadding);
      attempt += 1;
    }

    const rect = { x: candidate.x - width / 2, y: candidate.y - height / 2, width, height };
    placed.push({ node, x: candidate.x, y: candidate.y, rect });
  });
  return placed;
}
