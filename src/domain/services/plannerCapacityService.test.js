import { describe, it, expect } from 'vitest';
import { evaluateCapacity, suggestRebalance, fairnessScore } from './plannerCapacityService';

describe('plannerCapacityService', () => {
  const model = {
    creators: [
      { id: 'c1', weeklySlots: 1, complexityBudget: 5, plannedPTO: ['2026-05-05'] },
      { id: 'c2', weeklySlots: 4, complexityBudget: 12, plannedPTO: [] },
    ],
    reviewers: [{ id: 'r1', weeklySlots: 3, complexityBudget: 9, plannedPTO: [] }],
  };

  it('flags overload/underload including PTO collisions', () => {
    const issues = [
      { id: 'i1', ownerId: 'c1', reviewerId: 'r1', publishDate: '2026-05-05', complexityPoints: 4 },
      { id: 'i2', ownerId: 'c1', reviewerId: 'r1', publishDate: '2026-05-06', complexityPoints: 4 },
    ];
    const result = evaluateCapacity({ issues, model });
    expect(result.creator.c1.signal).toBe('overload');
    expect(result.creator.c1.ptoCollisionCount).toBe(1);
    expect(result.creator.c2.signal).toBe('underload');
  });

  it('suggests rebalance toward underloaded owner and improves fairness', () => {
    const issues = [
      { id: 'i1', ownerId: 'c1', publishDate: '2026-05-06', complexityPoints: 5 },
      { id: 'i2', ownerId: 'c1', publishDate: '2026-05-07', complexityPoints: 4 },
      { id: 'i3', ownerId: 'c2', publishDate: '2026-05-08', complexityPoints: 1 },
    ];
    const suggestions = suggestRebalance({ issues, model });
    expect(suggestions.length).toBeGreaterThan(0);
    const updated = issues.map((issue) => {
      const move = suggestions.find((s) => s.issueId === issue.id);
      return move ? { ...issue, ownerId: move.to } : issue;
    });
    expect(fairnessScore(updated)).toBeLessThan(fairnessScore(issues));
  });
});
