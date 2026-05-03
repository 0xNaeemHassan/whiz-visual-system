import assert from 'node:assert/strict';
import { computeMilestoneProgress, computeMilestoneUnlockEvents } from '../src/domain/services/milestoneTrackerService.js';

const frames = [
  { id: 1, tier: 'A', layout: 'grid' },
  { id: 2, tier: 'B', layout: 'table' },
  { id: 3, tier: 'C', layout: 'timeline' },
  { id: 4, tier: 'D', layout: 'matrix' },
  { id: 5, tier: 'E', layout: 'scorecard' },
  { id: 6, tier: 'F', layout: 'flow' },
];
const mkIssue = (id, status, frameId) => ({ id: `i_${id}`, status, frameId: String(frameId) });

const small = computeMilestoneProgress({ issues: [mkIssue(1, 'published', 1), mkIssue(2, 'published', 2)], frames });
assert.equal(small.publishedCount, 2);
assert.equal(small.checklist[0].complete, false);

const issues = [
  ...Array.from({ length: 6 }, (_, i) => mkIssue(i + 1, 'published', (i % 6) + 1)),
  mkIssue(7, 'draft', 1),
];
const p2 = computeMilestoneProgress({ issues, frames });
const first = computeMilestoneUnlockEvents({ progress: p2, alreadyFired: [] });
assert.equal(first.events.length, 1);
const second = computeMilestoneUnlockEvents({ progress: p2, alreadyFired: first.firedMilestones });
assert.equal(second.events.length, 0);

console.log('milestone tracker tests passed');
