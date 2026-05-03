const DEV = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;

export const PERF_THRESHOLDS = {
  1: { initialRenderMs: 100, interactionLatencyMs: 24, exportMs: 800, memoryMb: 180 },
  2: { initialRenderMs: 140, interactionLatencyMs: 32, exportMs: 1200, memoryMb: 260 },
  3: { initialRenderMs: 180, interactionLatencyMs: 45, exportMs: 1700, memoryMb: 340 },
};

export const EXPORT_LAYOUT_COST_THRESHOLDS = {
  1: { medium: 12, high: 20, critical: 28 },
  2: { medium: 18, high: 28, critical: 40 },
  3: { medium: 24, high: 36, critical: 50 },
};

function resolveLayoutThresholds(tier) {
  return EXPORT_LAYOUT_COST_THRESHOLDS[tier] || EXPORT_LAYOUT_COST_THRESHOLDS[2];
}

export function getLayoutCostSeverity(score, { tier = 2 } = {}) {
  const thresholds = resolveLayoutThresholds(tier);
  if (score >= thresholds.critical) return 'critical';
  if (score >= thresholds.high) return 'high';
  if (score >= thresholds.medium) return 'medium';
  return 'low';
}

export function getMaxImageDrawSize({ tier = 2, severity = 'low' } = {}) {
  const limits = {
    1: { low: 1600, medium: 1300, high: 1100, critical: 900 },
    2: { low: 2000, medium: 1700, high: 1400, critical: 1200 },
    3: { low: 2400, medium: 2100, high: 1800, critical: 1500 },
  };
  return limits[tier]?.[severity] || limits[2][severity] || limits[2].low;
}

const getMemoryMb = () => {
  const bytes = globalThis.performance?.memory?.usedJSHeapSize;
  return typeof bytes === 'number' ? +(bytes / (1024 * 1024)).toFixed(1) : null;
};

const getThreshold = (tier, metric) => PERF_THRESHOLDS[tier]?.[metric] ?? null;

export function perfMeasure(name, start, { tier, metric, extra } = {}) {
  if (!DEV) return null;
  const duration = +(performance.now() - start).toFixed(2);
  const limit = getThreshold(tier, metric);
  const memoryMb = getMemoryMb();
  const withinBudget = typeof limit === 'number' ? duration <= limit : true;
  const level = withinBudget ? 'log' : 'warn';
  console[level]('[perf]', name, {
    durationMs: duration,
    tier,
    metric,
    thresholdMs: limit,
    withinBudget,
    memoryMb,
    ...(extra || {}),
  });
  return duration;
}

export function perfLog(name, { tier, metric, value, unit = 'ms', extra } = {}) {
  if (!DEV) return;
  const limit = getThreshold(tier, metric);
  const withinBudget = typeof limit === 'number' ? value <= limit : true;
  const level = withinBudget ? 'log' : 'warn';
  console[level]('[perf]', name, {
    value,
    unit,
    tier,
    metric,
    threshold: limit,
    withinBudget,
    memoryMb: getMemoryMb(),
    ...(extra || {}),
  });
}

export const perfNow = () => (DEV ? performance.now() : 0);
export const isPerfDev = () => DEV;
