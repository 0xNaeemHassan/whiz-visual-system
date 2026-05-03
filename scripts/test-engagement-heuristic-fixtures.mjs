import assert from 'node:assert/strict';
import { scoreEngagementHeuristic } from '../src/domain/services/engagementHeuristicService.js';

const fixtureIssues = [
  { id: '1', topic: 'ETF Flows', frameId: '3', status: 'published', publishDate: '2026-05-02', confidence: 'high' },
  { id: '2', topic: 'ETF Flows', frameId: '3', status: 'done', publishDate: '2026-05-04', confidence: 'medium' },
  { id: '3', topic: 'Stablecoin Velocity', frameId: '3', status: 'published', publishDate: '2026-05-01', confidence: 'high' },
  { id: '4', topic: 'Macro Liquidity', frameId: '7', status: 'draft', publishDate: '2026-05-20', confidence: 'low' },
];

const candidate = { id: 'x', topic: 'ETF Flows', frameId: '3', status: 'planned', publishDate: '2026-05-05', confidence: 'high' };
const resultA = scoreEngagementHeuristic({ issue: candidate, issues: fixtureIssues });
const resultB = scoreEngagementHeuristic({ issue: candidate, issues: fixtureIssues });

assert.deepEqual(resultA, resultB);
assert.equal(resultA.scorePercent, 75);
assert.deepEqual(resultA.reasonCodes, [
  'novelty_low',
  'timeliness_strong',
  'frame_fit_strong',
  'topic_prior_weak',
  'confidence_strong',
]);
assert.equal(resultA.advisoryOnly, true);

console.log('test-engagement-heuristic-fixtures: ok');
