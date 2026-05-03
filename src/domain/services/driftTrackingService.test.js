import { describe, it, expect } from 'vitest';
import { computeIssueDrift, computeWeeklyDriftSummary } from './driftTrackingService';

describe('drift tracking math', () => {
  it('calculates timing/frame drift across reschedules and replans', () => {
    const now = new Date('2026-05-03T00:00:00.000Z');
    const issue = {
      id: 'a1',
      publishDate: '2026-05-10',
      frameId: '',
      confidence: 'medium',
      verificationState: 'pending',
      replanCount: 2,
      rescheduleCount: 3,
    };
    const result = computeIssueDrift(issue, now);
    expect(result.drift.timing.score).toBe(7);
    expect(result.drift.frame.score).toBe(11);
    expect(result.total).toBe(34);
  });

  it('generates weekly summary and breach notifications payload', () => {
    const now = new Date('2026-05-03T00:00:00.000Z');
    const summary = computeWeeklyDriftSummary([
      { id: 'hot', issueNum: '101', topic: 'Hot', publishDate: '2026-04-01', confidence: 'low', verificationState: 'missing', replanCount: 1, updatedAt: '2026-05-02' },
      { id: 'stable', issueNum: '102', topic: 'Stable', publishDate: '2026-05-06', confidence: 'high', verificationState: 'verified', updatedAt: '2026-05-02' },
    ], now);
    expect(summary.weeklyCount).toBe(2);
    expect(summary.byType.verification).toBeGreaterThan(5);
    expect(summary.remediationActions.length).toBeGreaterThan(0);
    expect(summary.breaches.some((b) => b.id === 'hot')).toBe(true);
  });
});
