const DEV = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;

export const PERF_THRESHOLDS = {
  1: { initialRenderMs: 100, interactionLatencyMs: 24, exportMs: 800, memoryMb: 180, layoutShift: 0.08 },
  2: { initialRenderMs: 140, interactionLatencyMs: 32, exportMs: 1200, memoryMb: 260, layoutShift: 0.12 },
  3: { initialRenderMs: 180, interactionLatencyMs: 45, exportMs: 1700, memoryMb: 340, layoutShift: 0.18 },
};

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
