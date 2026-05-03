const FRAME_TYPE_REQUIREMENTS = Object.freeze({
  table: ['title', 'thesis', 'keyValues', 'riskFlags', 'dataTimestamps'],
  stats: ['title', 'thesis', 'keyValues', 'riskFlags', 'dataTimestamps'],
  bignum: ['title', 'thesis', 'keyValues', 'riskFlags', 'dataTimestamps'],
  default: ['title', 'thesis', 'keyValues', 'riskFlags', 'dataTimestamps'],
});

const safe = (v) => String(v || '').trim();

export function generateExportSummary({ frame, content = {}, complianceIssues = [], validationWarnings = [] }) {
  const title = safe(content.title);
  const thesis = safe(content.thesis || content.deck || content.body).slice(0, 280);
  const keyValues = [
    ...(Array.isArray(content.stats) ? content.stats : []).map((s) => ({ label: safe(s?.label), value: safe(s?.value) })).filter((s) => s.label || s.value),
    ...(content.bigLabel || content.bigNumber ? [{ label: safe(content.bigLabel), value: safe(content.bigNumber) }] : []),
    ...(content.targetMetric ? [{ label: 'Target Metric', value: safe(content.targetMetric) }] : []),
  ];
  const timestamps = new Set([
    safe(content.date),
    safe(content.nextDrop),
    ...((Array.isArray(content.stats) ? content.stats : []).map((s) => safe(s?.provenance?.date))),
    ...((Array.isArray(content.tableRows) ? content.tableRows : []).map((r) => safe(r?.provenance?.date))),
  ].filter(Boolean));

  const summary = {
    frameId: frame?.id || null,
    frameType: frame?.layout || 'default',
    title,
    thesis,
    keyValues,
    riskFlags: [...complianceIssues, ...validationWarnings].filter(Boolean),
    dataTimestamps: Array.from(timestamps),
    exportedAt: new Date().toISOString(),
  };

  return summary;
}

export function validateSummaryCompleteness(summary = {}) {
  const required = FRAME_TYPE_REQUIREMENTS[summary.frameType] || FRAME_TYPE_REQUIREMENTS.default;
  return required.every((field) => {
    const value = summary[field];
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(String(value || '').trim());
  });
}

export function buildSummaryText(summary = {}) {
  const lines = [
    `Title: ${summary.title || 'N/A'}`,
    `Thesis: ${summary.thesis || 'N/A'}`,
    `Frame: #${summary.frameId || 'N/A'} (${summary.frameType || 'default'})`,
    `Exported At: ${summary.exportedAt || 'N/A'}`,
    'Key Values:',
    ...((summary.keyValues || []).map((kv) => `- ${kv.label || 'Unlabeled'}: ${kv.value || 'N/A'}`)),
    'Risk Flags:',
    ...((summary.riskFlags || []).map((r) => `- ${r}`)),
    'Data Timestamps:',
    ...((summary.dataTimestamps || []).map((t) => `- ${t}`)),
  ];
  return lines.join('\n');
}
