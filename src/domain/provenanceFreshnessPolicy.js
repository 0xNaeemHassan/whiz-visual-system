const DAY_MS = 24 * 60 * 60 * 1000;

export const DATA_CATEGORY_MAX_AGE_DAYS = Object.freeze({
  marketPrices: 1,
  quarterlyFundamentals: 120,
  default: 30,
});

export const FRESHNESS_STATUS = Object.freeze({
  FRESH: 'fresh',
  AGING: 'aging',
  STALE: 'stale',
  UNKNOWN: 'unknown',
});

const resolveCapturedAt = (provenance = {}) => provenance?.capturedAt || provenance?.date || '';

export const classifyProvenanceFreshness = ({ provenance, category = 'default', now = new Date() }) => {
  const capturedAtRaw = resolveCapturedAt(provenance);
  const capturedAtDate = capturedAtRaw ? new Date(capturedAtRaw) : null;
  const maxAgeDays = DATA_CATEGORY_MAX_AGE_DAYS[category] ?? DATA_CATEGORY_MAX_AGE_DAYS.default;
  if (!capturedAtDate || Number.isNaN(capturedAtDate.getTime())) {
    return { status: FRESHNESS_STATUS.UNKNOWN, category, maxAgeDays, capturedAt: null, ageDays: null };
  }
  const ageDays = Math.max(0, (now.getTime() - capturedAtDate.getTime()) / DAY_MS);
  const agingThreshold = maxAgeDays * 0.7;
  const status = ageDays > maxAgeDays
    ? FRESHNESS_STATUS.STALE
    : ageDays > agingThreshold
      ? FRESHNESS_STATUS.AGING
      : FRESHNESS_STATUS.FRESH;
  return { status, category, maxAgeDays, capturedAt: capturedAtDate.toISOString(), ageDays: Number(ageDays.toFixed(2)) };
};

export const evaluateContentFreshness = ({ stats = [], tableRows = [], now = new Date() } = {}) => {
  const statOutcomes = (Array.isArray(stats) ? stats : []).map((stat, index) => ({
    index,
    label: stat?.label || `stat_${index + 1}`,
    ...classifyProvenanceFreshness({ provenance: stat?.provenance, category: 'marketPrices', now }),
  }));
  const tableOutcomes = (Array.isArray(tableRows) ? tableRows : []).map((row, index) => ({
    index,
    label: `row_${index + 1}`,
    ...classifyProvenanceFreshness({ provenance: row?.provenance, category: 'quarterlyFundamentals', now }),
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
