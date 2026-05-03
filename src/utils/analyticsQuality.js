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

export function aggregateOutcomeWindows(issues = [], now = new Date()) {
  const windows = { d7: [], d30: [], d90: [] };
  const msByWindow = { d7: 7 * 86400000, d30: 30 * 86400000, d90: 90 * 86400000 };
  issues.forEach((issue) => {
    const outcome = issue?.outcomes;
    const recordedAt = outcome?.recordedAt || issue?.publishDate;
    const date = recordedAt ? new Date(recordedAt) : null;
    if (!date || Number.isNaN(date.getTime())) return;
    const age = now.getTime() - date.getTime();
    Object.entries(msByWindow).forEach(([windowKey, maxAge]) => {
      if (age <= maxAge && age >= 0) windows[windowKey].push(issue);
    });
  });
  return windows;
}

export function computeRecommendationDeltas(issues = []) {
  const scored = issues.filter((issue) => Number.isFinite(issue?.outcomes?.engagementRate) || Number.isFinite(issue?.outcomes?.conversionProxy));
  const topicScores = new Map();
  const frameScores = new Map();
  const cadenceBySeries = new Map();
  scored.forEach((issue) => {
    const score = (Number(issue?.outcomes?.engagementRate) || 0) * 0.6 + (Number(issue?.outcomes?.conversionProxy) || 0) * 0.4;
    const topic = String(issue.topic || '').trim();
    const frame = String(issue.frameId || '').trim();
    if (topic) topicScores.set(topic, [...(topicScores.get(topic) || []), score]);
    if (frame) frameScores.set(frame, [...(frameScores.get(frame) || []), score]);
    if (issue.series && issue.publishDate) cadenceBySeries.set(issue.series, [...(cadenceBySeries.get(issue.series) || []), issue.publishDate]);
  });
  const avg = (arr = []) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const topTopic = [...topicScores.entries()].sort((a, b) => avg(b[1]) - avg(a[1]))[0];
  const topFrame = [...frameScores.entries()].sort((a, b) => avg(b[1]) - avg(a[1]))[0];
  return {
    heuristicPriors: {
      topic: topTopic ? { key: topTopic[0], score: avg(topTopic[1]) } : null,
      frame: topFrame ? { key: topFrame[0], score: avg(topFrame[1]) } : null,
    },
    cadenceSuggestion: [...cadenceBySeries.entries()].map(([series, dates]) => {
      const sorted = dates.map((d) => new Date(d)).filter((d) => !Number.isNaN(d.getTime())).sort((a, b) => a - b);
      if (sorted.length < 2) return { series, cadenceDays: null };
      const gaps = [];
      for (let i = 1; i < sorted.length; i += 1) gaps.push(Math.round((sorted[i] - sorted[i - 1]) / 86400000));
      return { series, cadenceDays: Math.round(avg(gaps)) };
    }).filter((item) => item.cadenceDays != null),
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
