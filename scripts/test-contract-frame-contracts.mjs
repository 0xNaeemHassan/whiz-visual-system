import assert from 'node:assert/strict';
import { resolveFrameContract, frameContracts } from '../src/domain/frameContracts.js';

console.log('frameContracts contract v1');

const baseFrame = { id: 1, layout: 'plain' };
const base = resolveFrameContract(baseFrame);
assert.deepEqual(base.requiredMetadataFields, ['topicTag', 'title', 'deck']);
assert.equal(base.limits.topicTag.maxLength, 48);

const tableFrame = resolveFrameContract({ id: 2, layout: 'table' });
assert.ok(tableFrame.requiredContent.some((rule) => rule.path === 'tableRows' && rule.minItems === 1));

const boundaryFrame = resolveFrameContract({ id: 4, layout: 'table' });
const tableRowsRules = boundaryFrame.requiredContent.filter((rule) => rule.path === 'tableRows');
assert.ok(tableRowsRules.some((rule) => rule.minItems === 1), 'layout minItems contract should be present');
assert.ok(tableRowsRules.some((rule) => rule.minItems === 8), 'frame id override minItems contract should be present');

const backwardCompat = resolveFrameContract({ id: 15, layout: 'stats' });
assert.ok(backwardCompat.requiredMetadataFields.includes('topicTag'));
assert.ok(backwardCompat.requiredContent.some((rule) => rule.path === 'stats' && rule.minItems === 3));
assert.ok(backwardCompat.requiredContent.some((rule) => rule.path === 'stats' && rule.minItems === 8));

assert.equal(frameContracts.byLayout.timeline.requiredContent[0].minItems, 3, 'timeline baseline should stay stable');

const unknown = resolveFrameContract({ id: 999, layout: 'unknown' });
assert.deepEqual(unknown.requiredContent, []);

console.log('frameContracts contract tests passed');
