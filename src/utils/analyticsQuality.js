export function getCadenceAlerts(series = [], thresholdDays = 7) {
  if (!Array.isArray(series) || series.length < 2) return [];
  const dates = series
    .map((d) => new Date(d?.date))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a - b);
  if (dates.length < 2) return [];

  const alerts = [];
  for (let i = 1; i < dates.length; i += 1) {
    const diffDays = Math.round((dates[i] - dates[i - 1]) / 86400000);
    if (diffDays >= thresholdDays) {
      alerts.push({ type: 'cadence_gap', days: diffDays, thresholdDays });
    }
  }
  return alerts;
}

export function getSeriesDrift(series = []) {
  if (!Array.isArray(series) || series.length === 0) return { drift: 0, confidence: 0 };
  const numeric = series.map((p) => Number(p?.value)).filter((v) => Number.isFinite(v));
  if (numeric.length < 2) return { drift: 0, confidence: 0 };
  const drift = numeric[numeric.length - 1] - numeric[0];

  const confidenceValues = series
    .map((p) => Number(p?.confidence))
    .filter((v) => Number.isFinite(v));
  const confidence = confidenceValues.length
    ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length
    : 0;
  return { drift, confidence };
}

export function buildMetricProvenance(metric = {}, fallbackSource = 'unknown') {
  const source = String(metric?.source || fallbackSource).trim().toLowerCase() || 'unknown';
  const capturedAt = metric?.capturedAt && !Number.isNaN(new Date(metric.capturedAt).getTime())
    ? new Date(metric.capturedAt).toISOString()
    : null;
  return {
    source,
    method: String(metric?.method || 'unspecified').trim().toLowerCase(),
    capturedAt,
  };
}

export function normalizeIssue(issue = {}) {
  const base = (issue && typeof issue === 'object') ? issue : {};
  return {
    ...base,
    phase: Number(base.phase) || 1,
    title: String(base.title || '').trim(),
    phase4: base.phase4 && typeof base.phase4 === 'object' ? { ...base.phase4 } : base.phase4,
  };
}

export function validateEditorImport(payload) {
  return Boolean(payload && typeof payload === 'object' && !Array.isArray(payload));
}

export function normalizeEditorImport(payload) {
  if (!validateEditorImport(payload)) {
    return { content: {}, overrides: {}, meta: { invalid: true } };
  }
  return {
    content: payload.content && typeof payload.content === 'object' ? payload.content : {},
    overrides: payload.overrides && typeof payload.overrides === 'object' ? payload.overrides : {},
    meta: payload.meta && typeof payload.meta === 'object' ? payload.meta : {},
  };
}
