import { TICKER_CONTRACT } from '../domain/tickerContract';
import { SPINE_DESIGN_TOKENS } from '../domain/spineDesignTokens';

export const TYPE_SCALE = [10, 12, 14, 18, 24, 36, 56, 84];

const HEX_RE = /^#([0-9a-f]{6}|[0-9a-f]{8})$/i;
const TOPIC_TAG_RE = /^[A-Z0-9]+(?: [A-Z0-9]+){0,3}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function nearestTypeScale(value) {
  return TYPE_SCALE.reduce((prev, curr) => (
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  ), TYPE_SCALE[0]);
}




export function resolveBigNumberHierarchy({
  availableWidth = 560,
  availableHeight = 220,
  bigValue = '',
  unit = '',
  label = '',
  companionMetrics = 0,
} = {}) {
  const valueLen = String(bigValue || '').trim().length || 1;
  const unitLen = String(unit || '').trim().length;
  const labelLen = String(label || '').trim().length;
  const areaFactor = Math.max(0.65, Math.min(1.35, Math.sqrt((availableWidth * availableHeight) / (560 * 220))));
  const densityPenalty = Math.min(0.25, companionMetrics * 0.04);

  const targetBig = (84 * areaFactor) - (valueLen * 1.6) - (unitLen * 1.2) - (labelLen > 24 ? 4 : 0) - (84 * densityPenalty);
  const big = nearestTypeScale(targetBig);
  const unitTarget = Math.max(10, big * 0.42);
  const labelTarget = Math.max(10, big * 0.24);
  const resolvedUnit = nearestTypeScale(unitTarget);
  const resolvedLabel = nearestTypeScale(labelTarget);

  const spacingBigToUnit = Math.max(4, Math.round(big * 0.08));
  const spacingUnitToLabel = Math.max(4, Math.round(resolvedUnit * 0.5));
  const minContrastGap = 6;

  const estimatedWidth = (valueLen * big * 0.62) + (unitLen * resolvedUnit * 0.58);
  const hierarchyValid = (
    big - resolvedUnit >= minContrastGap
    && resolvedUnit - resolvedLabel >= 2
    && spacingBigToUnit >= 4
    && spacingUnitToLabel >= 4
    && estimatedWidth <= availableWidth
  );

  const failureStates = [];
  if (estimatedWidth > availableWidth) failureStates.push('Big-number hierarchy failure: available width cannot fit value/unit without truncation.');
  if (big - resolvedUnit < minContrastGap) failureStates.push('Big-number hierarchy failure: value-unit contrast gap below minimum.');
  if (resolvedUnit - resolvedLabel < 2) failureStates.push('Big-number hierarchy failure: unit-label contrast gap below minimum.');
  if (spacingBigToUnit < 4 || spacingUnitToLabel < 4) failureStates.push('Big-number hierarchy failure: spacing guardrail below minimum.');

  return {
    big,
    unit: resolvedUnit,
    label: resolvedLabel,
    spacingBigToUnit,
    spacingUnitToLabel,
    hierarchyValid,
    failureStates,
  };
}
function relativeLuminance(hex) {
  if (!HEX_RE.test(hex || '')) return null;
  const value = hex.slice(1, 7);
  const rgb = [value.slice(0, 2), value.slice(2, 4), value.slice(4, 6)].map((part) => parseInt(part, 16) / 255);
  const linear = rgb.map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return (0.2126 * linear[0]) + (0.7152 * linear[1]) + (0.0722 * linear[2]);
}

function contrastRatio(fgHex, bgHex) {
  const l1 = relativeLuminance(fgHex);
  const l2 = relativeLuminance(bgHex);
  if (l1 == null || l2 == null) return null;
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getSlugFromTopic(topicTag = '') {
  return topicTag.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

function approxLuminance(hex) {
  if (!HEX_RE.test(hex || '')) return null;
  const value = hex.slice(1, 7);
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  return (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
}

export function getComplianceIssues({ overrides, content }) {
  const issues = [];
  const accentTouches = [
    overrides?.spineColor,
    overrides?.tickerColor,
    overrides?.accent?.color,
    overrides?.statsColor,
    overrides?.bignumColor,
    overrides?.tag?.color,
    overrides?.tag?.borderColor,
    overrides?.ruleBg,
    overrides?.avatarColor,
    overrides?.handleColor,
  ].filter(Boolean).length;

  if (accentTouches > 4) issues.push(`Too many accent overrides (${accentTouches}/4 max).`);

  const sizes = [
    overrides?.title?.fontSize ?? 52,
    overrides?.deck?.fontSize ?? 18,
    overrides?.body?.fontSize ?? 15,
  ];
  sizes.forEach((size) => {
    if (!TYPE_SCALE.includes(size)) issues.push(`Type size ${size}px is off-scale.`);
  });

  if ((overrides?.title?.fontSize ?? 52) <= (overrides?.deck?.fontSize ?? 18)) {
    issues.push('Big-number/title hierarchy drift: title should be larger than deck.');
  }

  if ((content?.body || '').length > 800 && (overrides?.body?.lineHeight ?? 1.75) < 1.5) {
    issues.push('Negative-space guardrail: long body copy needs line-height >= 1.5.');
  }

  if ((content?.tableRows || []).length > 0 && !(content?.tableHeaders || []).every(Boolean)) {
    issues.push('Strict table style enforcement: all table headers must be present.');
  }

  if (content?.tableRows?.length > 7) {
    issues.push('Strict overflow hierarchy: table row count should stay <= 7.');
  }

  if (content?.stats?.length > 6) {
    issues.push('Spacing-token rhythm: stats count exceeds 6-card rhythm.');
  }

  if ((content?.sparkData || '').trim()) {
    const points = content.sparkData.split(',').map((p) => Number(p.trim())).filter((p) => Number.isFinite(p));
    if (points.length < 5 || points.length > 16) issues.push('Sparkline constraints: use 5 to 16 numeric points.');
  }

  if (content?.tickerSpeed && (content.tickerSpeed < TICKER_CONTRACT.speed.min || content.tickerSpeed > TICKER_CONTRACT.speed.max)) {
    issues.push('Ticker speed should be between 10s and 60s.');
  }
  if (content?.tickerSpeed && content.tickerSpeed % TICKER_CONTRACT.speed.step !== 0) {
    issues.push('Ticker fidelity variance: use even-numbered ticker speed for normalized cadence.');
  }

  if (!content?.title?.trim()) issues.push('Title is required.');
  if (!content?.topicTag?.trim()) issues.push('Topic tag is required.');
  if (!TOPIC_TAG_RE.test((content?.topicTag || '').trim())) issues.push('Topic-tag normalization: use 1-4 words in uppercase alphanumerics.');

  const slug = getSlugFromTopic(content?.topicTag || '');
  if (!SLUG_RE.test(slug) || slug.length < 3 || slug.length > 36) {
    issues.push('Slug format drift: derived slug must be kebab-case and 3-36 chars.');
  }

  if (!content?.issueNum?.trim()) issues.push('Issue number is required.');
  if (content?.issueNum && !/^\d{3}$/.test(content.issueNum)) issues.push('Issue number should be 3 digits (e.g., 047).');

  if ((content?.bigNumber || '').trim() && !(content.bigNumber || '').match(/^[$€£]?\d[\d.,]*[KMBT%]?$/)) {
    issues.push('Big-number hierarchy heuristics: big number should be compact numeric notation.');
  }

  if ((content?.bigValue || '').trim()) {
    const hierarchy = resolveBigNumberHierarchy({
      bigValue: content.bigValue,
      unit: content.bigUnit || '',
      label: content.bigLabel || '',
      companionMetrics: Array.isArray(content?.stats) ? content.stats.length : 0,
    });
    if (!hierarchy.hierarchyValid) issues.push(...hierarchy.failureStates);
  }

  if (!Array.isArray(content?.stats) || content.stats.length === 0) issues.push('At least one stat is required.');

  if ((content?.sourceLinks || '').trim() === '') issues.push('Source links are required for publish-grade exports.');
  if (content?.nextDrop && !/^\d{4}-\d{2}-\d{2}$/.test(content.nextDrop)) issues.push('Next drop date must be YYYY-MM-DD.');

  const neutralColor = overrides?.body?.color;
  if (neutralColor && !['#8b95a3', '#f4f5f7', '#d0d6de'].includes(neutralColor.toLowerCase())) {
    issues.push('Neutral palette lock: body color must remain in approved neutrals.');
  }

  const spineTextColor = overrides?.spineColor || overrides?.accent?.color || null;
  const frameBg = overrides?.frameBg || null;
  const spineBar = overrides?.spineColor || overrides?.accent?.color || null;
  const textToBgContrast = contrastRatio(spineTextColor, frameBg);
  const textToSpineContrast = contrastRatio(spineTextColor, spineBar);
  const lowContrastAgainstBg = textToBgContrast !== null && textToBgContrast < SPINE_DESIGN_TOKENS.contrast.minRatio;
  const lowContrastAgainstSpine = textToSpineContrast !== null && textToSpineContrast < SPINE_DESIGN_TOKENS.contrast.minRatio;
  if (lowContrastAgainstBg || lowContrastAgainstSpine) {
    issues.push(`Rotated-spine contrast checks: minimum ${SPINE_DESIGN_TOKENS.contrast.minRatio}:1 required against spine/background combinations.`);
  }

  if ((overrides?.title?.letterSpacing ?? -0.02) > 0.12 || (overrides?.title?.lineHeight ?? 1.05) > 1.6) {
    issues.push('Anti-overstylization guardrails: title spacing/line-height is out of bounds.');
  }

  if ((overrides?.footer?.background || '').toLowerCase() === '#00000000') {
    issues.push('Footer semantics: transparent footer background is not publish-safe.');
  }

  return issues;
}

export function getBrandScore(input) {
  const issues = getComplianceIssues(input);
  const checks = [
    { label: 'Title provided', pass: Boolean(input?.content?.title?.trim()) },
    { label: 'Topic tag provided', pass: Boolean(input?.content?.topicTag?.trim()) },
    { label: 'Type scale compliant', pass: !issues.some((i) => i.includes('off-scale')) },
    { label: 'Accent discipline (<=4)', pass: !issues.some((i) => i.includes('Too many accent overrides')) },
    { label: 'Overflow hierarchy constrained', pass: !issues.some((i) => i.includes('overflow hierarchy')) },
    { label: 'Ticker normalized cadence', pass: !issues.some((i) => i.includes('Ticker fidelity variance')) },
    { label: 'Topic/slug normalized', pass: !issues.some((i) => i.includes('Topic-tag normalization') || i.includes('Slug format drift')) },
    { label: 'Neutral palette locked', pass: !issues.some((i) => i.includes('Neutral palette lock')) },
  ];
  const score = Math.max(0, Math.round((checks.filter((c) => c.pass).length / checks.length) * 100));
  return { score, checks, issues };
}
