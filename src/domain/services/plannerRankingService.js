const CONFIDENCE_SCORE = {
  low: 0.25,
  medium: 0.6,
  high: 1,
};

const DEFAULT_RANKING_WEIGHTS = {
  opportunity: 0.6,
  confidence: 0.3,
  freshnessPenalty: 0.1,
};

const clampWeight = (value, fallback) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, n);
};

const normalizeWeights = (weights = DEFAULT_RANKING_WEIGHTS) => {
  const normalized = {
    opportunity: clampWeight(weights.opportunity, DEFAULT_RANKING_WEIGHTS.opportunity),
    confidence: clampWeight(weights.confidence, DEFAULT_RANKING_WEIGHTS.confidence),
    freshnessPenalty: clampWeight(weights.freshnessPenalty, DEFAULT_RANKING_WEIGHTS.freshnessPenalty),
  };
  const total = normalized.opportunity + normalized.confidence + normalized.freshnessPenalty;
  if (total <= 0) return { ...DEFAULT_RANKING_WEIGHTS };
  return {
    opportunity: normalized.opportunity / total,
    confidence: normalized.confidence / total,
    freshnessPenalty: normalized.freshnessPenalty / total,
  };
};

const getConfidenceScore = (confidence = 'medium') => CONFIDENCE_SCORE[confidence] ?? CONFIDENCE_SCORE.medium;

const getFreshnessPenalty = (publishDate, now = new Date()) => {
  if (!publishDate) return 0.5;
  const d = new Date(publishDate);
  if (Number.isNaN(d.getTime())) return 0.5;
  const ageDays = Math.max(0, (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(ageDays / 30, 1);
};

const getOpportunityScore = (issue = {}) => {
  const statusBoost = {
    draft: 1,
    planned: 0.8,
    wip: 0.6,
    done: 0.4,
    published: 0.2,
  }[issue.status] ?? 0.7;
  const priorityBoost = {
    high: 1,
    medium: 0.7,
    low: 0.4,
  }[issue.priority] ?? 0.7;
  return Number(((statusBoost * 0.6) + (priorityBoost * 0.4)).toFixed(4));
};

export const rankPlannerIssue = (issue, options = {}) => {
  const weights = normalizeWeights(options.weights);
  const opportunityScore = getOpportunityScore(issue);
  const confidenceScore = getConfidenceScore(issue?.confidence);
  const freshnessPenalty = getFreshnessPenalty(issue?.publishDate, options.now);
  const rankScore = (opportunityScore * weights.opportunity)
    + (confidenceScore * weights.confidence)
    - (freshnessPenalty * weights.freshnessPenalty);

  return {
    rankScore,
    components: { opportunityScore, confidenceScore, freshnessPenalty },
    weights,
    breakdown: `(${opportunityScore.toFixed(2)}×${weights.opportunity.toFixed(2)}) + (${confidenceScore.toFixed(2)}×${weights.confidence.toFixed(2)}) - (${freshnessPenalty.toFixed(2)}×${weights.freshnessPenalty.toFixed(2)})`,
  };
};

export const rankPlannerIssues = (issues = [], options = {}) => issues
  .map((issue) => {
    const ranking = rankPlannerIssue(issue, options);
    return { ...issue, ranking };
  })
  .sort((a, b) => b.ranking.rankScore - a.ranking.rankScore || (b.createdAt || 0) - (a.createdAt || 0));

export { DEFAULT_RANKING_WEIGHTS, normalizeWeights };
