const METRIC_CONFIG = {
  percent: { method: 'mad', sensitivity: 3.2 },
  currency: { method: 'iqr', sensitivity: 1.5 },
  ratio: { method: 'zscore', sensitivity: 2.8 },
  score: { method: 'zscore', sensitivity: 2.5 },
  default: { method: 'mad', sensitivity: 3.5 },
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

export function detectRowSeriesDeltas(rows = [], options = {}) {
  const metricType = options.metricType || inferMetricType(rows[0]?.col3);
  const cfg = { ...METRIC_CONFIG.default, ...(METRIC_CONFIG[metricType] || {}), ...(options.config || {}) };
  const series = rows.map((row, index) => ({ index, value: parseNumericValue(row?.col3) })).filter((d) => d.value !== null);
  const values = series.map((d) => d.value);
  if (values.length < 4) return { metricType, config: cfg, flags: [] };

  const mu = mean(values);
  const sigma = std(values) || 1;
  const med = median(values);
  const mad = median(values.map((n) => Math.abs(n - med))) || 1;
  const q1 = q(values, 0.25);
  const q3 = q(values, 0.75);
  const iqr = (q3 - q1) || 1;

  const flags = series.flatMap(({ index, value }) => {
    let score = 0;
    let explanation = '';
    if (cfg.method === 'zscore') {
      score = Math.abs((value - mu) / sigma);
      explanation = `z-score ${score.toFixed(2)} exceeds threshold ${cfg.sensitivity}.`;
    } else if (cfg.method === 'iqr') {
      const low = q1 - cfg.sensitivity * iqr;
      const high = q3 + cfg.sensitivity * iqr;
      score = value < low ? (low - value) / iqr : value > high ? (value - high) / iqr : 0;
      explanation = `Value is outside IQR fence [${low.toFixed(2)}, ${high.toFixed(2)}].`;
    } else {
      score = Math.abs(0.6745 * (value - med) / mad);
      explanation = `MAD score ${score.toFixed(2)} exceeds threshold ${cfg.sensitivity}.`;
    }
    if (score <= cfg.sensitivity) return [];
    return [{ rowIndex: index, score, method: cfg.method, metricType, explanation, acknowledged: false }];
  });

  return { metricType, config: cfg, flags };
}
