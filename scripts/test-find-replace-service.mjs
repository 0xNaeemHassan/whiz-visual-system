import assert from 'node:assert/strict';
import { applyFindReplace, previewFindReplace, getEditableScopes, getEditableContentPaths } from '../src/domain/services/findReplaceService.js';

const frames = [
  { frameId: 1, content: { title: 'Alpha Note', deck: 'Alpha deck', body: 'alpha body', topicTag: 'ALPHA', tableHeaders: ['Metric'], tableRows: [{ col1: 'alpha value' }], stats: [{ label: 'Alpha users', value: '100 alpha' }], bullPoints: ['alpha point'], metadata: { issueNum: 'alpha-001' }, footer: { left: 'alpha footer' } } },
  { frameId: 2, content: { title: 'Beta Note', body: 'beta body alpha' } },
];

const scopes = getEditableScopes();
assert.ok(scopes.text.titles.includes('title'));
assert.ok(scopes.tables.includes('tableRows'));

const paths = getEditableContentPaths();
assert.ok(paths.includes('stats'));
assert.ok(paths.includes('tableRows'));
assert.ok(paths.includes('metadata.issueNum'));
assert.ok(paths.includes('footer.left'));

const preview = previewFindReplace({ frames, findText: 'alpha', replaceText: 'omega', filter: { mode: 'current_frame', currentFrameId: 1 } });
assert.ok(preview.length >= 7);
assert.ok(preview.every((entry) => entry.frameId === 1));
assert.ok(preview.some((entry) => entry.path === 'stats[0].label'));
assert.ok(preview.some((entry) => entry.path === 'tableRows[0].col1'));
assert.ok(preview.some((entry) => entry.path === 'metadata.issueNum'));
assert.ok(preview.some((entry) => entry.path === 'footer.left'));

const currentOnly = applyFindReplace({ frames, findText: 'alpha', replaceText: 'omega', filter: { mode: 'current_frame', currentFrameId: 1 } });
assert.equal(currentOnly.frames[0].content.title, 'omega Note');
assert.equal(currentOnly.frames[1].content.body, 'beta body alpha');
assert.ok(currentOnly.replacements > 0);

const allFrames = applyFindReplace({ frames, findText: 'alpha', replaceText: 'omega', filter: { mode: 'all_saved_drafts' } });
assert.equal(allFrames.frames[1].content.body, 'beta body omega');

const selectedDrafts = applyFindReplace({ frames, findText: 'alpha', replaceText: 'omega', filter: { mode: 'saved_drafts', draftIds: [2] } });
assert.equal(selectedDrafts.frames[0].content.title, 'Alpha Note');
assert.equal(selectedDrafts.frames[1].content.body, 'beta body omega');

assert.equal(currentOnly.batch.type, 'find_replace_batch');
assert.equal(currentOnly.batch.replacements, currentOnly.replacements);

console.log('test-find-replace-service: ok');
