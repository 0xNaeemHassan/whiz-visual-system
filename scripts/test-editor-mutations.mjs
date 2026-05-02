import assert from 'node:assert/strict';
import { CONTENT_DEBOUNCED_FIELDS, getContentMutationOptions, buildMutationDispatcher } from '../src/pages/editorMutations.js';

assert.equal(getContentMutationOptions('title').immediate, false);
assert.equal(getContentMutationOptions('body').immediate, false);
assert.equal(getContentMutationOptions('stats').immediate, true);
assert.equal(getContentMutationOptions('title', true).immediate, true);
assert.ok(CONTENT_DEBOUNCED_FIELDS.has('title'));

const calls = [];
const setFactory = (name) => (updater, options) => calls.push({ name, options, updater });
const m = buildMutationDispatcher({ setContent: setFactory('content'), setOverrides: setFactory('style'), setMedia: setFactory('media') });

m.content('title', (s) => ({ ...s, title: 'abc' }));
m.content('stats', (s) => ({ ...s, stats: [] }));
m.style((s) => ({ ...s, title: { color: '#fff' } }));
m.image((s) => ({ ...s, uploadedImages: { logo: 'x' } }));
m.content('body', (s) => ({ ...s, body: 'x' }), true);

assert.deepEqual(calls.map((c) => c.options.immediate), [false, true, true, true, true]);

// Cross-action undo chain contract: structural/style/image must be immediate snapshots.
const chain = calls.slice(1, 4).every((c) => c.options.immediate === true);
assert.equal(chain, true);

// reset actions should use immediate semantics by design contract
assert.equal(getContentMutationOptions('topicTag', true).immediate, true);

console.log('Editor mutation tests passed');
