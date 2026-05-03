import { FRAMES } from '../../data/frames';
import { FRAME_GUIDANCE_BY_ID } from '../../data/frameGuidance';
import { getLayoutDatasetShape } from '../../data/frameDatasetShapes';

const DATASET_LAYOUT_MAP = Object.freeze({
  table: new Set(['table', 'scorecard', 'tier-list']),
  timeline: new Set(['timeline', 'long-bet']),
  split: new Set(['bull-bear']),
  grid: new Set(['grid', 'quote']),
  stats: new Set(['stats', 'pitch-deck']),
});

const INTENT_TAG_MAP = Object.freeze({
  compare: ['comparison', 'versus', 'ranking', 'head-to-head'],
  explain: ['explainer', 'education', 'framework'],
  risk: ['risk', 'postmortem', 'security'],
  thesis: ['thesis', 'editorial', 'opinion'],
  recap: ['weekly', 'recap', 'calendar'],
});

const URGENCY_LAYOUT_BONUS = Object.freeze({
  high: new Set(['table', 'timeline', 'grid']),
  medium: new Set(['bull-bear', 'stats']),
  low: new Set(['thesis', 'cover-story', 'postmortem']),
});

const CONFIDENCE_TIER_BONUS = Object.freeze({ low: 'D', medium: 'C', high: 'G' });

function normalize(value, fallback) {
  const clean = String(value || '').trim().toLowerCase();
  return clean || fallback;
}

export function rankFrameCandidates(input, options = {}) {
  const topN = Number(options.topN) > 0 ? Number(options.topN) : 3;
  const dataShape = normalize(input?.dataShape, 'generic');
  const intent = normalize(input?.intent, 'recap');
  const urgency = normalize(input?.urgency, 'medium');
  const confidence = normalize(input?.confidence, 'medium');
  const rejectFeedback = Array.isArray(options.rejectFeedback) ? options.rejectFeedback : [];

  const scored = FRAMES.map((frame) => {
    let score = 0;
    const reasons = [];
    const shape = getLayoutDatasetShape(frame.layout);

    if (shape.dataset === dataShape || DATASET_LAYOUT_MAP[dataShape]?.has(frame.layout)) {
      score += 4;
      reasons.push(`Data shape fit: ${dataShape}`);
    }

    const intentSignals = INTENT_TAG_MAP[intent] || [];
    const matchingTags = frame.tags.filter((tag) => intentSignals.some((signal) => tag.includes(signal)));
    if (matchingTags.length > 0) {
      score += 3;
      reasons.push(`Intent fit: ${intent} (${matchingTags[0]})`);
    }

    if (URGENCY_LAYOUT_BONUS[urgency]?.has(frame.layout)) {
      score += 2;
      reasons.push(`Urgency fit: ${urgency}`);
    }

    if (frame.tier === CONFIDENCE_TIER_BONUS[confidence]) {
      score += 1;
      reasons.push(`Confidence match: ${confidence}`);
    }

    const feedbackPenalty = rejectFeedback.filter((entry) => Number(entry.frameId) === frame.id).length;
    if (feedbackPenalty > 0) {
      score -= feedbackPenalty * 2;
      reasons.push('De-prioritized from reject feedback');
    }

    const guidance = FRAME_GUIDANCE_BY_ID[frame.id];
    if (guidance?.bestUseCases?.length) {
      reasons.push(`Use case: ${guidance.bestUseCases[0]}`);
    }

    return { frame, score, reasons };
  });

  return scored
    .sort((a, b) => b.score - a.score || a.frame.id - b.frame.id)
    .slice(0, topN)
    .map((entry, rank) => ({
      rank: rank + 1,
      frameId: entry.frame.id,
      frameName: entry.frame.name,
      score: entry.score,
      reasons: entry.reasons.slice(0, 3),
    }));
}
