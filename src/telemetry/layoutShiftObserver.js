import { isPerfDev, perfLog, PERF_THRESHOLDS } from '../utils/perfProfiler';

const ACTION_KEYS = Object.freeze({
  themeSwitch: 'themeSwitch',
  fontLoad: 'fontLoad',
  layoutSwitch: 'layoutSwitch',
});

const isRenderableEntry = (entry) => !entry?.hadRecentInput && Number.isFinite(entry?.value) && entry.value > 0;

export function createLayoutShiftObserver({ containers = [], report = () => {} } = {}) {
  const session = { totalShift: 0, byContainer: {}, actions: {} };
  const observed = [];

  const update = (entry, action = null) => {
    if (!isRenderableEntry(entry)) return;
    const sourceNode = entry.sources?.[0]?.node;
    const target = containers.find((container) => container?.contains?.(sourceNode));
    const containerKey = target?.dataset?.telemetryContainer || target?.id || 'global';
    session.totalShift += entry.value;
    session.byContainer[containerKey] = +(session.byContainer[containerKey] || 0) + entry.value;
    if (action) session.actions[action] = +(session.actions[action] || 0) + entry.value;
    report(getSnapshot());
  };

  const observer = globalThis.PerformanceObserver ? new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => update(entry));
  }) : null;

  const start = () => {
    if (!observer) return false;
    observer.observe({ type: 'layout-shift', buffered: true });
    return true;
  };

  const stop = () => observer?.disconnect();

  const markAction = async (actionKey, executor) => {
    if (!ACTION_KEYS[actionKey]) return executor?.();
    const before = session.totalShift;
    const result = await executor?.();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const delta = +(session.totalShift - before).toFixed(4);
    session.actions[actionKey] = +(session.actions[actionKey] || 0) + delta;
    report(getSnapshot());
    return result;
  };

  const getSnapshot = () => ({
    totalShift: +session.totalShift.toFixed(4),
    byContainer: Object.fromEntries(Object.entries(session.byContainer).map(([k, v]) => [k, +v.toFixed(4)])),
    actions: Object.fromEntries(Object.entries(session.actions).map(([k, v]) => [k, +v.toFixed(4)])),
  });

  return { start, stop, markAction, getSnapshot, actionKeys: ACTION_KEYS, thresholds: PERF_THRESHOLDS.layoutShift || null };
}

export function reportLayoutShiftDiagnostics(snapshot, { tier = 2 } = {}) {
  if (!isPerfDev()) return { warnings: [], threshold: null };
  const threshold = PERF_THRESHOLDS?.[tier]?.layoutShift ?? null;
  perfLog('layout-shift.session', { tier, metric: 'layoutShift', value: snapshot.totalShift, unit: 'cls' });
  const warnings = [];
  if (typeof threshold === 'number' && snapshot.totalShift > threshold) {
    warnings.push(`Cumulative layout shift ${snapshot.totalShift} exceeds threshold ${threshold}.`);
  }
  Object.entries(snapshot.actions || {}).forEach(([action, value]) => {
    if (typeof threshold === 'number' && value > threshold * 0.5) warnings.push(`${action} shift delta ${value} is elevated.`);
  });
  return { warnings, threshold };
}
