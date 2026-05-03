import assert from 'node:assert/strict';
import { evaluatePlannerScore } from '../src/domain/services/plannerScoreService.js';

const fixtureCalendar = [
  { topic: 'Macro overview', frameId: '1', publishDate: '2026-01-01', status: 'published', metricProvenance: ['cpi:2025-12-20'] },
  { topic: 'Onchain flows', frameId: '2', publishDate: '2026-01-08', status: 'published', metricProvenance: ['flows:2025-12-28'] },
  { topic: 'AI infra', frameId: '3', publishDate: '2026-01-15', status: 'done', metricProvenance: ['infra:2026-01-10'] },
  { topic: 'Macro overview', frameId: '1', publishDate: '2026-01-29', status: 'planned', metricProvenance: ['macro:2025-11-15'] },
];

const now = new Date('2026-02-01T00:00:00Z');
const runA = evaluatePlannerScore(fixtureCalendar, now);
const runB = evaluatePlannerScore(fixtureCalendar, now);
assert.deepEqual(runA, runB, 'Planner score should be reproducible for fixed fixture calendars');

const shuffled = [...fixtureCalendar].reverse();
const runC = evaluatePlannerScore(shuffled, now);
assert.deepEqual(runA, runC, 'Planner score should be order-independent for fixed fixtures');

console.log('planner score reproducibility: ok');
