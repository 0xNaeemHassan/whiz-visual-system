const DAY_MS = 24 * 60 * 60 * 1000;

export const DATA_CATEGORY_MAX_AGE_DAYS = Object.freeze({
  marketPrices: 1,
  macro: 31,
  onChain: 2,
  quarterlyFundamentals: 120,
  default: 30,
});

export const METRIC_CLASS_POLICY = Object.freeze({
  market: { category: 'marketPrices', staleAfterDays: DATA_CATEGORY_MAX_AGE_DAYS.marketPrices, level: 'blocking', remediation: 'Refresh prices from latest market close and update provenance.date.' },
  macro: { category: 'macro', staleAfterDays: DATA_CATEGORY_MAX_AGE_DAYS.macro, level: 'warning', remediation: 'Re-check the latest macro release calendar and update provenance.date.' },
  onChain: { category: 'onChain', staleAfterDays: DATA_CATEGORY_MAX_AGE_DAYS.onChain, level: 'blocking', remediation: 'Re-query chain indexers or explorers and refresh provenance.date.' },
  quarterlyFundamentals: { category: 'quarterlyFundamentals', staleAfterDays: DATA_CATEGORY_MAX_AGE_DAYS.quarterlyFundamentals, level: 'warning', remediation: 'Confirm the most recent filing period and refresh provenance.date.' },
  default: { category: 'default', staleAfterDays: DATA_CATEGORY_MAX_AGE_DAYS.default, level: 'warning', remediation: 'Revalidate source recency and refresh provenance.date.' },
});

export const FRESHNESS_STATUS = Object.freeze({
  FRESH: 'fresh',
  AGING: 'aging',
  STALE: 'stale',
  FUTURE_DATE: 'future-date',
  UNKNOWN: 'unknown',
});

const resolveCapturedAt = (provenance = {}) => provenance?.capturedAt || provenance?.date || '';

export const resolveMetricClassPolicy = (metricClass = 'default') => METRIC_CLASS_POLICY[metricClass] || METRIC_CLASS_POLICY.default;

export const classifyProvenanceFreshness = ({ provenance, category = 'default', metricClass = 'default', now = new Date() }) => {
  const capturedAtRaw = resolveCapturedAt(provenance);
  const capturedAtDate = capturedAtRaw ? new Date(capturedAtRaw) : null;
  const policy = resolveMetricClassPolicy(metricClass);
  const resolvedCategory = category === 'default' ? policy.category : category;
  const maxAgeDays = policy.staleAfterDays ?? DATA_CATEGORY_MAX_AGE_DAYS[resolvedCategory] ?? DATA_CATEGORY_MAX_AGE_DAYS.default;
  if (!capturedAtDate || Number.isNaN(capturedAtDate.getTime())) {
    return { status: FRESHNESS_STATUS.UNKNOWN, category: resolvedCategory, metricClass, maxAgeDays, capturedAt: null, ageDays: null, diagnostics: { stale: false, futureDate: false, missingDate: true } };
  }
  const rawAgeDays = (now.getTime() - capturedAtDate.getTime()) / DAY_MS;
  const isFutureDate = rawAgeDays < 0;
  const ageDays = Math.max(0, rawAgeDays);
  const agingThreshold = maxAgeDays * 0.7;
  const status = isFutureDate
    ? FRESHNESS_STATUS.FUTURE_DATE
    : ageDays > maxAgeDays
    ? FRESHNESS_STATUS.STALE
    : ageDays > agingThreshold
      ? FRESHNESS_STATUS.AGING
      : FRESHNESS_STATUS.FRESH;
  return {
    status,
    category: resolvedCategory,
    metricClass,
    maxAgeDays,
    capturedAt: capturedAtDate.toISOString(),
    ageDays: Number(ageDays.toFixed(2)),
    diagnostics: {
      stale: status === FRESHNESS_STATUS.STALE,
      futureDate: isFutureDate,
      missingDate: false,
    },
  };
};

export const evaluateContentFreshness = ({ stats = [], tableRows = [], now = new Date() } = {}) => {
  const statOutcomes = (Array.isArray(stats) ? stats : []).map((stat, index) => ({
    index,
    label: stat?.label || `stat_${index + 1}`,
    ...classifyProvenanceFreshness({ provenance: stat?.provenance, metricClass: 'market', now }),
  }));
  const tableOutcomes = (Array.isArray(tableRows) ? tableRows : []).map((row, index) => ({
    index,
    label: `row_${index + 1}`,
    ...classifyProvenanceFreshness({ provenance: row?.provenance, metricClass: 'quarterlyFundamentals', now }),
  }));
  const combined = [...statOutcomes, ...tableOutcomes];
  return {
    stats: statOutcomes,
    tableRows: tableOutcomes,
    totals: {
      fresh: combined.filter((item) => item.status === FRESHNESS_STATUS.FRESH).length,
      aging: combined.filter((item) => item.status === FRESHNESS_STATUS.AGING).length,
      stale: combined.filter((item) => item.status === FRESHNESS_STATUS.STALE).length,
      unknown: combined.filter((item) => item.status === FRESHNESS_STATUS.UNKNOWN).length,
    },
    hasAging: combined.some((item) => item.status === FRESHNESS_STATUS.AGING),
    hasStale: combined.some((item) => item.status === FRESHNESS_STATUS.STALE),
  };
};
