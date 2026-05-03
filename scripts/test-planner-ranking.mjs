import assert from 'node:assert/strict';
import { rankPlannerIssues } from '../src/domain/services/plannerRankingService.js';

const now = new Date('2026-05-03T00:00:00Z');

const base = {
  id: '1',
  status: 'draft',
  priority: 'high',
  createdAt: 1,
};

const scenarios = [
  {
    name: 'higher confidence outranks lower confidence',
    issues: [
      { ...base, id: 'high', confidence: 'high', publishDate: '2026-05-01' },
      { ...base, id: 'low', confidence: 'low', publishDate: '2026-05-01' },
    ],
    expectedTop: 'high',
  },
  {
    name: 'freshness penalty demotes stale issue',
    issues: [
      { ...base, id: 'fresh', confidence: 'medium', publishDate: '2026-04-28' },
      { ...base, id: 'stale', confidence: 'medium', publishDate: '2026-02-01' },
    ],
    expectedTop: 'fresh',
  },
  {
    name: 'weight shift can favor confidence over opportunity',
    issues: [
      { id: 'opp', status: 'draft', priority: 'high', confidence: 'low', publishDate: '2026-05-01', createdAt: 1 },
      { id: 'conf', status: 'done', priority: 'low', confidence: 'high', publishDate: '2026-05-01', createdAt: 2 },
    ],
    expectedTop: 'conf',
    weights: { opportunity: 0.2, confidence: 0.7, freshnessPenalty: 0.1 },
  },
];

scenarios.forEach(({ name, issues, expectedTop, weights }) => {
  const ranked = rankPlannerIssues(issues, { now, weights });
  assert.equal(ranked[0].id, expectedTop, name);
});

console.log('planner ranking scenarios passed');
