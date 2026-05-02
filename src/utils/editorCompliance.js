import { TICKER_CONTRACT } from '../domain/tickerContract';

export const TYPE_SCALE = [10, 12, 14, 18, 24, 36, 56, 84];

const HEX_RE = /^#([0-9a-f]{6}|[0-9a-f]{8})$/i;
const TOPIC_TAG_RE = /^[A-Z0-9]+(?: [A-Z0-9]+){0,3}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function nearestTypeScale(value) {
  return TYPE_SCALE.reduce((prev, curr) => (
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  ), TYPE_SCALE[0]);
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

  if (!Array.isArray(content?.stats) || content.stats.length === 0) issues.push('At least one stat is required.');

  if ((content?.sourceLinks || '').trim() === '') issues.push('Source links are required for publish-grade exports.');
  if (content?.nextDrop && !/^\d{4}-\d{2}-\d{2}$/.test(content.nextDrop)) issues.push('Next drop date must be YYYY-MM-DD.');

  const neutralColor = overrides?.body?.color;
  if (neutralColor && !['#8b95a3', '#f4f5f7', '#d0d6de'].includes(neutralColor.toLowerCase())) {
    issues.push('Neutral palette lock: body color must remain in approved neutrals.');
  }

  const spineLum = approxLuminance(overrides?.spineColor || overrides?.accent?.color || '');
  const bgLum = approxLuminance(overrides?.frameBg || '');
  if (spineLum !== null && bgLum !== null && Math.abs(spineLum - bgLum) < 0.25) {
    issues.push('Rotated-spine contrast checks: spine contrast is too low against background.');
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
