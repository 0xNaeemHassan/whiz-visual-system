const DEFAULT_COMPLEXITY_THRESHOLD = 65;

const getTextLength = (value) => (typeof value === 'string' ? value.trim().length : 0);

export const evaluateEditorComplexity = ({ content = {}, uploadedImages = {}, whizEffects = {}, overflowMeta = {}, threshold = DEFAULT_COMPLEXITY_THRESHOLD } = {}) => {
  const imageCount = Object.values(uploadedImages || {}).filter(Boolean).length;
  const effectDensity = Object.values(whizEffects || {}).filter(Boolean).length;
  const overflowActive = Boolean(overflowMeta?.truncation?.hasFallback);

  const score = Math.min(100,
    (imageCount * 20)
    + (effectDensity * 15)
    + (overflowActive ? 25 : 0)
    + (getTextLength(content?.body) > 420 ? 15 : 0)
    + (getTextLength(content?.deck) > 160 ? 10 : 0),
  );

  const causes = [];
  if (imageCount >= 2) causes.push({ key: 'image-count', label: `Image count: ${imageCount} active`, detail: 'High image count increases layout pressure.' });
  if (effectDensity >= 2) causes.push({ key: 'effect-density', label: `Effect density: ${effectDensity} effects enabled`, detail: 'Too many effects can hurt readability.' });
  if (overflowActive) causes.push({ key: 'text-overflow', label: 'Text overflow fallback is active', detail: 'At least one surface exceeded its text budget.' });

  return {
    score,
    threshold,
    exceedsThreshold: score >= threshold,
    causes,
    tips: [
      { key: 'reduce-effects', label: 'Reduce effects' },
      { key: 'simplified-profile', label: 'Use simplified preset/profile' },
    ],
  };
};
