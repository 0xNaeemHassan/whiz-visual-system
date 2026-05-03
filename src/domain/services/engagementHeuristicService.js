const clamp01 = (value) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

const CONFIDENCE_WEIGHTS = { low: 0.4, medium: 0.7, high: 1 };

export const HEURISTIC_REASON_CODES = {
  NOVELTY_HIGH: 'novelty_high',
  NOVELTY_LOW: 'novelty_low',
  TIMELINESS_STRONG: 'timeliness_strong',
  TIMELINESS_WEAK: 'timeliness_weak',
  FRAME_FIT_STRONG: 'frame_fit_strong',
  FRAME_FIT_WEAK: 'frame_fit_weak',
  TOPIC_PRIOR_STRONG: 'topic_prior_strong',
  TOPIC_PRIOR_WEAK: 'topic_prior_weak',
  CONFIDENCE_STRONG: 'confidence_strong',
  CONFIDENCE_WEAK: 'confidence_weak',
};

export const DEFAULT_HEURISTIC_WEIGHTS = {
  novelty: 0.24,
  timeliness: 0.22,
  frameFit: 0.2,
  priorTopicPerformance: 0.2,
  confidence: 0.14,
};

export const scoreEngagementHeuristic = ({ issue = {}, issues = [], weights = DEFAULT_HEURISTIC_WEIGHTS } = {}) => {
  const topic = (issue.topic || '').trim().toLowerCase();
  const issueId = issue.id;
  const frameId = String(issue.frameId || '');

  const comparable = issues.filter((entry) => entry && entry.id !== issueId);
  const sameTopic = comparable.filter((entry) => (entry.topic || '').trim().toLowerCase() === topic);
  const sameFrame = comparable.filter((entry) => String(entry.frameId || '') === frameId);

  const novelty = sameTopic.length === 0 ? 1 : clamp01(1 / (sameTopic.length + 1));

  const publishDate = issue.publishDate ? new Date(issue.publishDate) : null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  let timeliness = 0.5;
  if (publishDate instanceof Date && !Number.isNaN(publishDate.getTime())) {
    const dayDiff = Math.round((publishDate - now) / 86400000);
    if (dayDiff >= 0 && dayDiff <= 2) timeliness = 1;
    else if (dayDiff <= 7) timeliness = 0.85;
    else if (dayDiff <= 30) timeliness = 0.65;
    else timeliness = 0.45;
  }

  const frameFit = sameFrame.length >= 3 ? 1 : clamp01(0.45 + (sameFrame.length * 0.18));

  const publishedPeers = sameTopic.filter((entry) => entry.status === 'published').length;
  const priorTopicPerformance = sameTopic.length === 0
    ? 0.6
    : clamp01((publishedPeers / sameTopic.length) * 0.9 + 0.1);

  const confidence = clamp01(CONFIDENCE_WEIGHTS[issue.confidence] ?? CONFIDENCE_WEIGHTS.medium);

  const factorScores = { novelty, timeliness, frameFit, priorTopicPerformance, confidence };
  const score = clamp01(Object.entries(weights).reduce((acc, [key, weight]) => acc + ((factorScores[key] ?? 0) * weight), 0));

  const reasonCodes = [
    novelty >= 0.7 ? HEURISTIC_REASON_CODES.NOVELTY_HIGH : HEURISTIC_REASON_CODES.NOVELTY_LOW,
    timeliness >= 0.7 ? HEURISTIC_REASON_CODES.TIMELINESS_STRONG : HEURISTIC_REASON_CODES.TIMELINESS_WEAK,
    frameFit >= 0.65 ? HEURISTIC_REASON_CODES.FRAME_FIT_STRONG : HEURISTIC_REASON_CODES.FRAME_FIT_WEAK,
    priorTopicPerformance >= 0.65 ? HEURISTIC_REASON_CODES.TOPIC_PRIOR_STRONG : HEURISTIC_REASON_CODES.TOPIC_PRIOR_WEAK,
    confidence >= 0.75 ? HEURISTIC_REASON_CODES.CONFIDENCE_STRONG : HEURISTIC_REASON_CODES.CONFIDENCE_WEAK,
  ];

  return {
    score,
    scorePercent: Math.round(score * 100),
    label: 'Banger Potential',
    advisoryOnly: true,
    reasonCodes,
    factors: factorScores,
  };
};

export const createEngagementOutcomeFeedback = ({ issueId, score, outcome = {}, timestamp = Date.now() } = {}) => ({
  issueId,
  score: clamp01(score),
  outcome,
  timestamp,
  feedbackType: 'engagement_outcome',
});
