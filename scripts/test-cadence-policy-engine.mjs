import assert from 'node:assert/strict';
import { computeCadencePolicy, CADENCE_SLOT_STATE } from '../src/domain/services/cadencePolicyEngine.js';

const baseIssues = [
  { id: '1', status: 'planned', publishDate: '2026-05-04' },
  { id: '2', status: 'published', publishDate: '2026-05-06' },
];

const res = computeCadencePolicy({
  issues: baseIssues,
  cadenceConfig: { days: [1, 3, 5], timezone: 'UTC', graceWindowHours: 2, weekStartsOn: 1 },
  now: new Date('2026-05-09T12:00:00Z'),
});
assert.equal(res.slots.length, 3);
assert.equal(res.slots.find((s) => s.slotKey === '2026-05-04').state, CADENCE_SLOT_STATE.AT_RISK);
assert.equal(res.slots.find((s) => s.slotKey === '2026-05-06').state, CADENCE_SLOT_STATE.ON_TRACK);
assert.equal(res.slots.find((s) => s.slotKey === '2026-05-08').state, CADENCE_SLOT_STATE.MISSED);
assert.equal(res.debt, 1);

const boundary = computeCadencePolicy({
  issues: [{ id: 'x', status: 'published', publishDate: '2026-05-11' }],
  cadenceConfig: { days: [1], timezone: 'America/New_York', graceWindowHours: 4, weekStartsOn: 1 },
  now: new Date('2026-05-11T03:30:00Z'),
});
assert.equal(boundary.slots[0].slotKey, '2026-05-04');
assert.equal(boundary.slots[0].state, CADENCE_SLOT_STATE.MISSED);

console.log('cadence policy engine contract checks passed');
