import { describe, it, expect } from 'vitest';
import { rankFrameCandidates } from './frameRecommendationService';

describe('rankFrameCandidates', () => {
  it('prioritizes comparison tables for compare + table inputs', () => {
    const picks = rankFrameCandidates({ dataShape: 'table', intent: 'compare', urgency: 'high', confidence: 'medium' }, { topN: 3 });
    expect(picks).toHaveLength(3);
    expect(picks[0].frameId).toBe(16);
    expect(picks.map((p) => p.frameId)).toContain(20);
  });

  it('includes risk explainers for split + risk inputs', () => {
    const picks = rankFrameCandidates({ dataShape: 'split', intent: 'risk', urgency: 'medium', confidence: 'low' }, { topN: 3 });
    expect(picks.map((p) => p.frameId)).toContain(23);
  });

  it('applies reject feedback penalty to demote previously rejected frames', () => {
    const baseline = rankFrameCandidates({ dataShape: 'table', intent: 'compare', urgency: 'high', confidence: 'medium' }, { topN: 1 });
    const penalized = rankFrameCandidates({ dataShape: 'table', intent: 'compare', urgency: 'high', confidence: 'medium' }, { topN: 1, rejectFeedback: [{ frameId: baseline[0].frameId, reason: 'Mismatch' }, { frameId: baseline[0].frameId, reason: 'Mismatch' }] });
    expect(penalized[0].frameId).not.toBe(baseline[0].frameId);
  });
});
