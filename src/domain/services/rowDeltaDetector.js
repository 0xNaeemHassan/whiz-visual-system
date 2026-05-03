const METRIC_CONFIG = {
  percent: { series: { method: 'mad', sensitivity: 3.2 }, delta: { method: 'zscore', sensitivity: 2.8 } },
  currency: { series: { method: 'iqr', sensitivity: 1.5 }, delta: { method: 'mad', sensitivity: 3.1 } },
  ratio: { series: { method: 'zscore', sensitivity: 2.8 }, delta: { method: 'zscore', sensitivity: 2.6 } },
  score: { series: { method: 'zscore', sensitivity: 2.5 }, delta: { method: 'mad', sensitivity: 3.0 } },
  default: { series: { method: 'mad', sensitivity: 3.5 }, delta: { method: 'mad', sensitivity: 3.2 } },
};

const mean = (nums) => nums.reduce((s, n) => s + n, 0) / (nums.length || 1);
const median = (nums) => {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const std = (nums) => {
  const m = mean(nums);
  return Math.sqrt(mean(nums.map((n) => (n - m) ** 2)));
};
const q = (nums, p) => {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const pos = (s.length - 1) * p;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return s[lo];
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
};

export const inferMetricType = (sample = '') => {
  const text = String(sample || '');
  if (/%/.test(text)) return 'percent';
  if (/[$€£]/.test(text)) return 'currency';
  if (/\//.test(text)) return 'ratio';
  return 'default';
};

export const parseNumericValue = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const cleaned = String(value ?? '').replace(/[$,%\s]/g, '').replace(/,/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

function evaluateOutlier(value, values, cfg, label = 'value') {
  const mu = mean(values);
  const sigma = std(values) || 1;
  const med = median(values);
  const mad = median(values.map((n) => Math.abs(n - med))) || 1;
  const q1 = q(values, 0.25);
  const q3 = q(values, 0.75);
  const iqr = (q3 - q1) || 1;

  if (cfg.method === 'zscore') {
    const score = Math.abs((value - mu) / sigma);
    return { score, expectedRange: [mu - cfg.sensitivity * sigma, mu + cfg.sensitivity * sigma], observed: value, explanation: `${label} expected in [${(mu - cfg.sensitivity * sigma).toFixed(2)}, ${(mu + cfg.sensitivity * sigma).toFixed(2)}], observed ${value.toFixed(2)}.` };
  }
  if (cfg.method === 'iqr') {
    const low = q1 - cfg.sensitivity * iqr;
    const high = q3 + cfg.sensitivity * iqr;
    const score = value < low ? (low - value) / iqr : value > high ? (value - high) / iqr : 0;
    return { score, expectedRange: [low, high], observed: value, explanation: `${label} expected in [${low.toFixed(2)}, ${high.toFixed(2)}], observed ${value.toFixed(2)}.` };
  }
  const score = Math.abs(0.6745 * (value - med) / mad);
  const scaled = (cfg.sensitivity * mad) / 0.6745;
  return { score, expectedRange: [med - scaled, med + scaled], observed: value, explanation: `${label} expected in [${(med - scaled).toFixed(2)}, ${(med + scaled).toFixed(2)}], observed ${value.toFixed(2)}.` };
}

export function detectRowSeriesDeltas(rows = [], options = {}) {
  const metricType = options.metricType || inferMetricType(rows[0]?.col3);
  const metricConfig = { ...METRIC_CONFIG.default, ...(METRIC_CONFIG[metricType] || {}), ...(options.config || {}) };
  const seriesCfg = metricConfig.series || METRIC_CONFIG.default.series;
  const deltaCfg = metricConfig.delta || METRIC_CONFIG.default.delta;
  const series = rows.map((row, index) => ({ index, value: parseNumericValue(row?.col3) })).filter((d) => d.value !== null);
  const values = series.map((d) => d.value);
  if (values.length < 4) return { metricType, config: metricConfig, flags: [] };

  const seriesFlags = series.flatMap(({ index, value }) => {
    const evaluated = evaluateOutlier(value, values, seriesCfg, 'Series value');
    if (evaluated.score <= seriesCfg.sensitivity) return [];
    return [{ rowIndex: index, score: evaluated.score, method: seriesCfg.method, metricType, checkType: 'series', expectedRange: evaluated.expectedRange, observed: evaluated.observed, explanation: evaluated.explanation, acknowledged: false }];
  });

  const deltas = series.slice(1).map((point, idx) => ({ rowIndex: point.index, previousRowIndex: series[idx].index, value: point.value - series[idx].value }));
  const deltaValues = deltas.map((d) => d.value);
  const deltaFlags = deltaValues.length < 4 ? [] : deltas.flatMap((delta) => {
    const evaluated = evaluateOutlier(delta.value, deltaValues, deltaCfg, 'Row delta');
    if (evaluated.score <= deltaCfg.sensitivity) return [];
    return [{ rowIndex: delta.rowIndex, previousRowIndex: delta.previousRowIndex, score: evaluated.score, method: deltaCfg.method, metricType, checkType: 'delta', expectedRange: evaluated.expectedRange, observed: evaluated.observed, explanation: evaluated.explanation, acknowledged: false }];
  });

  return { metricType, config: metricConfig, flags: [...seriesFlags, ...deltaFlags] };
}
