import { describe, it, expect } from 'vitest';
import { analyzeSeriesIntegrity, suggestNextPart } from './seriesContinuityService';

describe('series continuity', () => {
  it('supports creating parts 1 to N with next-part suggestion', () => {
    const issues = [
      { id: 'a', series_id: 'stablecoin-risk', part_number: 1, frameId: '1', topicTag: 'RISK' },
      { id: 'b', series_id: 'stablecoin-risk', part_number: 2, frameId: '1', topicTag: 'RISK' },
    ];
    const suggestion = suggestNextPart(issues[1], issues);
    expect(suggestion.part_number).toBe(3);
    expect(suggestion.prev_issue).toBe('b');
    expect(suggestion.frameId).toBe('1');
  });

  it('detects missing parts and enables insertion workflows', () => {
    const report = analyzeSeriesIntegrity([
      { id: 'a', series_id: 'stablecoin-risk', part_number: 1 },
      { id: 'c', series_id: 'stablecoin-risk', part_number: 3 },
    ]);
    expect(report[0].missingParts).toEqual([2]);
    expect(report[0].status).toBe('missing_part');
  });

  it('prevents branch continuity when previous issue is missing', () => {
    const report = analyzeSeriesIntegrity([
      { id: 'a', series_id: 'stablecoin-risk', part_number: 1 },
      { id: 'x', series_id: 'stablecoin-risk', part_number: 2, prev_issue: 'ghost' },
    ]);
    expect(report[0].blockedBranches).toHaveLength(1);
    expect(report[0].status).toBe('branch_blocked');
  });
});
