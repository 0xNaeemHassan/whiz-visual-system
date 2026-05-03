const FRAME_TYPE_REQUIREMENTS = Object.freeze({
  table: ['title', 'thesis', 'keyValues', 'riskFlags', 'dataTimestamps'],
  stats: ['title', 'thesis', 'keyValues', 'riskFlags', 'dataTimestamps'],
  bignum: ['title', 'thesis', 'keyValues', 'riskFlags', 'dataTimestamps'],
  default: ['title', 'thesis', 'keyValues', 'riskFlags', 'dataTimestamps'],
});

const safe = (v) => String(v || '').trim();
const normalizeConfidence = (value) => ['low', 'medium', 'high'].includes(String(value || '').toLowerCase()) ? String(value).toLowerCase() : 'medium';

export function generateExportSummary({ frame, content = {}, complianceIssues = [], validationWarnings = [], exportProfileDecision = null }) {
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
  const confidenceEntries = [
    ...(Array.isArray(content.stats) ? content.stats : []).map((s) => normalizeConfidence(s?.provenance?.confidence)),
    ...(Array.isArray(content.tableRows) ? content.tableRows : []).map((r) => normalizeConfidence(r?.provenance?.confidence)),
    ...(Array.isArray(content.timelineEvents) ? content.timelineEvents : []).map((e) => normalizeConfidence(e?.provenance?.confidence)),
  ];
  const confidenceSummary = confidenceEntries.reduce((acc, level) => ({ ...acc, [level]: (acc[level] || 0) + 1, total: (acc.total || 0) + 1 }), { low: 0, medium: 0, high: 0, total: 0 });

  const summary = {
    frameId: frame?.id || null,
    frameType: frame?.layout || 'default',
    title,
    thesis,
    keyValues,
    riskFlags: [...complianceIssues, ...validationWarnings].filter(Boolean),
    trustLevel: safe(content.trustLevel) || 'Draft',
    dataTimestamps: Array.from(timestamps),
    confidenceSummary,
    exportedAt: new Date().toISOString(),
    exportProfileDecision: exportProfileDecision || content.exportProfileDecision || null,
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
    `Trust Level: ${summary.trustLevel || 'Draft'}`,
    `Exported At: ${summary.exportedAt || 'N/A'}`,
    `Export Preset: ${summary.exportPresetId || 'standard'}`,
    `Export Params: ${summary.exportParameters ? `${summary.exportParameters.width}x${summary.exportParameters.height}, q=${summary.exportParameters.quality}, citation=${summary.exportParameters.citationMode}, effects=${summary.exportParameters.effectsPolicy}` : 'N/A'}`,
    'Key Values:',
    ...((summary.keyValues || []).map((kv) => `- ${kv.label || 'Unlabeled'}: ${kv.value || 'N/A'}`)),
    'Risk Flags:',
    ...((summary.riskFlags || []).map((r) => `- ${r}`)),
    'Data Timestamps:',
    ...((summary.dataTimestamps || []).map((t) => `- ${t}`)),
    `Confidence Summary: high=${summary.confidenceSummary?.high || 0}, medium=${summary.confidenceSummary?.medium || 0}, low=${summary.confidenceSummary?.low || 0}`,
  ];
  return lines.join('\n');
}
