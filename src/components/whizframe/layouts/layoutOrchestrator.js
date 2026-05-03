import { coreLayoutKeys } from './CoreLayouts';
import { applyOverflowPolicy } from './OverflowPolicy';

function getBaseTitleSize(content = {}, ov = {}) {
  if (ov.title?.fontSize) return ov.title.fontSize;
  const len = (content.title || '').length;
  if (len < 18) return 84;
  if (len < 30) return 56;
  if (len < 50) return 36;
  if (len < 80) return 24;
  return 18;
}

export function prepareLayoutPayload({ frame, aspectRatio, content, styleOverrides }) {
  const ov = styleOverrides || {};
  const layoutFamily = coreLayoutKeys.has(frame?.layout) ? 'core' : 'extended';
  const overflowResult = applyOverflowPolicy({
    family: layoutFamily,
    aspectRatio,
    content,
    ov,
    baseTitleSize: getBaseTitleSize(content, ov),
  });

  const resolvedContent = {
    ...overflowResult.content,
    overflowPolicy: {
      actions: overflowResult.actions,
      budget: overflowResult.budget,
      primitiveBudgets: overflowResult.primitiveBudgets,
    },
  };

  return {
    resolvedContent,
    resolvedOv: overflowResult.ov,
    resolvedTagText: resolvedContent?.chips?.[0] || resolvedContent.topicTag,
    baseTitleSize: getBaseTitleSize(content, ov),
  };
}
