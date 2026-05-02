export const TYPE_SCALE = [10, 12, 14, 18, 24, 36, 56, 84];

export function nearestTypeScale(value) {
  return TYPE_SCALE.reduce((prev, curr) => (
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  ), TYPE_SCALE[0]);
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

  if (!content?.title?.trim()) issues.push('Title is required.');
  if (!content?.topicTag?.trim()) issues.push('Topic tag is required.');
  if (!content?.issueNum?.trim()) issues.push('Issue number is required.');
  if (content?.issueNum && !/^\d{3}$/.test(content.issueNum)) issues.push('Issue number should be 3 digits (e.g., 047).');
  if (content?.tickerSpeed && (content.tickerSpeed < 10 || content.tickerSpeed > 60)) issues.push('Ticker speed should be between 10s and 60s.');
  if (!Array.isArray(content?.stats) || content.stats.length === 0) issues.push('At least one stat is required.');
  if ((content?.sourceLinks || '').trim() === '') issues.push('Source links are required for publish-grade exports.');
  if (content?.nextDrop && !/^\d{4}-\d{2}-\d{2}$/.test(content.nextDrop)) issues.push('Next drop date must be YYYY-MM-DD.');

  return issues;
}

export function getBrandScore(input) {
  const issues = getComplianceIssues(input);
  const checks = [
    { label: 'Title provided', pass: Boolean(input?.content?.title?.trim()) },
    { label: 'Topic tag provided', pass: Boolean(input?.content?.topicTag?.trim()) },
    { label: 'Type scale compliant', pass: !issues.some((i) => i.includes('off-scale')) },
    { label: 'Accent discipline (<=4)', pass: !issues.some((i) => i.includes('Too many accent overrides')) },
  ];
  const score = Math.max(0, Math.round((checks.filter((c) => c.pass).length / checks.length) * 100));
  return { score, checks, issues };
}
