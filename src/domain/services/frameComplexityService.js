const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

const normalizeByRange = (value, max) => clamp01((Number(value) || 0) / max);

const textLength = (value) => String(value || '').trim().length;

const countTruthy = (items = []) => (Array.isArray(items) ? items : []).filter(Boolean).length;

export function scoreFrameComplexity(state = {}) {
  const layout = state?.layout || state?.frameLayout || {};
  const content = state?.content || {};
  const overrides = state?.overrides || {};
  const whizEffects = state?.whizEffects || {};
  const uploadedImages = Array.isArray(state?.uploadedImages) ? state.uploadedImages : [];

  const layoutComplexity = normalizeByRange(
    (Number(content?.layoutDensity) || 0) + (Number(content?.layoutSpacing) || 0) + (Number(layout?.zones) || 0) * 0.2,
    2.4,
  );

  const contentChars = textLength(content?.title) + textLength(content?.deck) + textLength(content?.body)
    + (Array.isArray(content?.stats) ? content.stats.reduce((acc, row) => acc + textLength(row?.label) + textLength(row?.value), 0) : 0);
  const contentLength = normalizeByRange(contentChars, 1800);

  const imagesCount = uploadedImages.length + countTruthy([
    content?.avatarUrl,
    content?.heroImage,
    content?.imageUrl,
    overrides?.imageUrl,
  ]);
  const imageArea = uploadedImages.reduce((acc, img) => acc + ((Number(img?.width) || 0) * (Number(img?.height) || 0)), 0);
  const imagePayload = clamp01((normalizeByRange(imagesCount, 4) * 0.6) + (normalizeByRange(imageArea, 2_000_000) * 0.4));

  const overrideSignals = countTruthy([
    overrides?.frameBg,
    overrides?.spineColor,
    overrides?.tickerColor,
    overrides?.tickerBg,
    overrides?.patternOverlay,
    overrides?.bgGradient,
    overrides?.accent?.color,
  ]) + (Number(overrides?.title?.fontSize) !== 52 ? 1 : 0) + (Number(overrides?.body?.fontSize) !== 15 ? 1 : 0);
  const activeEffects = Object.values(whizEffects || {}).filter(Boolean).length;
  const effectsAndOverrides = clamp01((normalizeByRange(overrideSignals, 8) * 0.65) + (normalizeByRange(activeEffects, 3) * 0.35));

  const typographyDensity = clamp01((normalizeByRange((Number(overrides?.title?.fontSize) || 52) / Math.max(Number(overrides?.body?.fontSize) || 15, 1), 4) * 0.4)
    + (normalizeByRange((Number(overrides?.body?.lineHeight) || 1.5) < 1.2 ? 1 : 0, 1) * 0.25)
    + (normalizeByRange(contentChars, 1500) * 0.35));

  const breakdown = {
    layout: Number(layoutComplexity.toFixed(3)),
    contentLength: Number(contentLength.toFixed(3)),
    imagePayload: Number(imagePayload.toFixed(3)),
    effectsAndOverrides: Number(effectsAndOverrides.toFixed(3)),
    typographyDensity: Number(typographyDensity.toFixed(3)),
  };

  const weighted = (breakdown.layout * 0.2)
    + (breakdown.contentLength * 0.25)
    + (breakdown.imagePayload * 0.2)
    + (breakdown.effectsAndOverrides * 0.2)
    + (breakdown.typographyDensity * 0.15);

  return {
    score: Number(clamp01(weighted).toFixed(3)),
    breakdown,
  };
}

export function classifyComplexity(score) {
  const value = clamp01(score);
  if (value >= 0.85) return 'critical';
  if (value >= 0.65) return 'high';
  if (value >= 0.35) return 'medium';
  return 'low';
}
