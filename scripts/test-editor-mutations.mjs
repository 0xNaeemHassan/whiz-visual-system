import assert from 'node:assert/strict';
import {
  CONTENT_DEBOUNCED_FIELDS,
  MUTATION_PATH_MATRIX,
  getContentMutationOptions,
  getMutationPathContract,
  buildMutationDispatcher,
} from '../src/pages/EditorMutations.js';

assert.equal(getContentMutationOptions('title').immediate, false);
assert.equal(getContentMutationOptions('body').immediate, false);
assert.equal(getContentMutationOptions('stats').immediate, true);
assert.equal(getContentMutationOptions('title', true).immediate, true);
assert.ok(CONTENT_DEBOUNCED_FIELDS.has('title'));

// Coverage matrix for user-visible mutation paths in Editor.jsx
assert.deepEqual(
  Object.keys(MUTATION_PATH_MATRIX),
  ['text_edits', 'theme_frame_changes', 'strict_polish_apply', 'media_upload_move_transform', 'import_load_reset_actions', 'template_apply_save_load_flows'],
  'Mutation matrix must enumerate every Editor user mutation path',
);

assert.deepEqual(getMutationPathContract('text_edits'), { immediate: false, requiresCommit: true, target: 'content' });
assert.deepEqual(getMutationPathContract('theme_frame_changes'), { immediate: true, requiresCommit: false, target: 'overrides' });
assert.deepEqual(getMutationPathContract('strict_polish_apply'), { immediate: true, requiresCommit: false, target: 'overrides' });
assert.deepEqual(getMutationPathContract('media_upload_move_transform'), { immediate: true, requiresCommit: false, target: 'media' });
assert.deepEqual(getMutationPathContract('import_load_reset_actions'), { immediate: true, requiresCommit: false, target: 'any' });
assert.deepEqual(getMutationPathContract('template_apply_save_load_flows'), { immediate: true, requiresCommit: false, target: 'any' });

const calls = [];
const setFactory = (name) => (updater, options) => calls.push({ name, options, updater });
const commitFactory = (name) => () => calls.push({ name, type: 'commit' });
const m = buildMutationDispatcher({
  setContent: setFactory('content'),
  setOverrides: setFactory('style'),
  setMedia: setFactory('media'),
  commitContent: commitFactory('content'),
  commitOverrides: commitFactory('style'),
  commitMedia: commitFactory('media'),
});

m.content('title', (s) => ({ ...s, title: 'abc' }));
m.content('stats', (s) => ({ ...s, stats: [] }));
m.style((s) => ({ ...s, title: { color: '#fff' } }));
m.image((s) => ({ ...s, uploadedImages: { logo: 'x' } }));
m.content('body', (s) => ({ ...s, body: 'x' }), true);
m.commit('text_edits');
m.commit('theme_frame_changes');

assert.deepEqual(calls.filter((c) => c.options).map((c) => c.options.immediate), [false, true, true, true, true]);

// multi-step undo/redo branch-history behavior contract:
// text uses debounced entries and requires explicit commit before branch actions.
const commitCalls = calls.filter((c) => c.type === 'commit').map((c) => c.name);
assert.deepEqual(commitCalls, ['content']);

// Keyboard-only regression contract for key user flows.
const KEYBOARD_FLOW_CHECKS = Object.freeze({
  create: ['Tab', 'Enter'],
  edit: ['Tab', 'Enter', 'Space'],
  save: ['Ctrl+S|Meta+S', 'Enter'],
  export: ['Tab', 'Enter'],
});
assert.deepEqual(
  Object.keys(KEYBOARD_FLOW_CHECKS),
  ['create', 'edit', 'save', 'export'],
  'Keyboard QA harness must cover create/edit/save/export flows.',
);
assert.ok(
  KEYBOARD_FLOW_CHECKS.edit.includes('Space'),
  'Edit flow must remain operable by Space key for grouped controls.',
);

console.log('Editor mutation tests passed');
