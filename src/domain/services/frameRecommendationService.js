import { getLayoutDatasetShape } from '../../data/frameDatasetShapes';

const KEYWORD_INTENT_WEIGHTS = {
  comparison: ['compare', 'versus', 'vs', 'leaderboard', 'rank', 'top', 'winner', 'loser'],
  timeline: ['timeline', 'roadmap', 'history', 'sequence', 'phases'],
  risk: ['risk', 'hack', 'exploit', 'threat', 'failure', 'postmortem', 'security'],
  explainer: ['how', 'why', 'mechanism', 'walkthrough', 'explain'],
  macro: ['thesis', 'macro', 'forecast', 'prediction', 'outlook'],
  ecosystem: ['ecosystem', 'map', 'landscape', 'stack', 'network'],
  tracker: ['weekly', 'recap', 'snapshot', 'update', 'tracker'],
};

function inferIntent(text = '') {
  const lower = text.toLowerCase();
  const matches = Object.entries(KEYWORD_INTENT_WEIGHTS)
    .map(([intent, words]) => ({ intent, score: words.reduce((acc, w) => acc + (lower.includes(w) ? 1 : 0), 0) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
  return matches[0]?.intent || 'general';
}

function mapDataShapeToLayouts(dataShape = 'generic') {
  const shape = String(dataShape).toLowerCase();
  if (shape.includes('table') || shape.includes('ranking')) return ['table', 'scorecard', 'tier-list'];
  if (shape.includes('timeline')) return ['timeline', 'long-bet'];
  if (shape.includes('network') || shape.includes('map')) return ['network', 'constellation', 'trade-routes'];
  if (shape.includes('split')) return ['bull-bear'];
  if (shape.includes('grid')) return ['grid'];
  if (shape.includes('chart') || shape.includes('curve')) return ['curve', 'matrix'];
  return [];
}

function inferComplexityPenalty(frame, complexityBudget = 'medium') {
  const effort = Number(frame.effortMinutes || 45);
  const difficulty = frame.difficulty || (effort > 90 ? 'hard' : effort > 45 ? 'medium' : 'easy');
  if (complexityBudget === 'low') return difficulty === 'hard' ? -0.2 : difficulty === 'medium' ? -0.08 : 0;
  if (complexityBudget === 'high') return difficulty === 'hard' ? 0.05 : 0;
  return difficulty === 'hard' ? -0.07 : 0;
}

function historicalSignal(frame, historicalPerformance = {}) {
  const byFrame = historicalPerformance.byFrameId || {};
  const direct = byFrame[String(frame.id)] || byFrame[frame.id];
  if (typeof direct === 'number') return Math.max(-0.3, Math.min(0.3, direct));
  return 0;
}

export function rankRecommendedFrames({ frames = [], intent, topic = '', notes = '', dataShape = 'generic', complexityBudget = 'medium', historicalPerformance = {}, topK = 5 }) {
  const inferredIntent = intent || inferIntent(`${topic} ${notes}`);
  const layoutHints = new Set(mapDataShapeToLayouts(dataShape));

  const scored = frames.map((frame) => {
    const reasons = [];
    let score = 0.15;

    if (frame.tags?.includes(inferredIntent) || frame.tierName?.toLowerCase().includes(inferredIntent)) {
      score += 0.3;
      reasons.push(`matches intent (${inferredIntent})`);
    }

    const shape = getLayoutDatasetShape(frame.layout);
    if (layoutHints.has(frame.layout) || (shape.dataset && String(dataShape).toLowerCase().includes(shape.dataset))) {
      score += 0.25;
      reasons.push(`fits data shape (${shape.dataset || frame.layout})`);
    }

    const complexityAdj = inferComplexityPenalty(frame, complexityBudget);
    score += complexityAdj;
    if (complexityAdj < 0) reasons.push(`penalized for ${complexityBudget} complexity budget`);

    const histAdj = historicalSignal(frame, historicalPerformance);
    score += histAdj;
    if (histAdj !== 0) reasons.push(`historical performance adjustment (${histAdj > 0 ? '+' : ''}${histAdj.toFixed(2)})`);

    if (reasons.length === 0) reasons.push('general-purpose fit');

    return {
      frame,
      confidence: Math.max(0, Math.min(0.99, score)),
      rationale: reasons,
    };
  }).sort((a, b) => b.confidence - a.confidence || a.frame.id - b.frame.id);

  const recommendations = scored.slice(0, topK);
  const leader = recommendations[0];
  const lowConfidence = !leader || leader.confidence < 0.45;

  return {
    inferredIntent,
    recommendations,
    fallback: lowConfidence ? {
      reason: 'Low confidence in top match',
      fallbackFrameIds: frames.filter((frame) => ['table', 'grid', 'editorial'].includes(frame.layout)).slice(0, 3).map((frame) => frame.id),
    } : null,
  };
}
