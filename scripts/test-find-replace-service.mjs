import assert from 'node:assert/strict';
import { applyFindReplace, previewFindReplace, getEditableScopes } from '../src/domain/services/findReplaceService.js';

const frames = [
  { frameId: 1, content: { title: 'Alpha Note', deck: 'Alpha deck', body: 'alpha body', topicTag: 'ALPHA', tableHeaders: ['Metric'], tableRows: [{ col1: 'alpha value' }], stats: [{ label: 'Alpha users', value: '100 alpha' }], bullPoints: ['alpha point'] } },
  { frameId: 2, content: { title: 'Beta Note', body: 'beta body alpha' } },
];

const scopes = getEditableScopes();
assert.ok(scopes.text.titles.includes('title'));
assert.ok(scopes.tables.includes('tableRows'));

const preview = previewFindReplace({ frames, findText: 'alpha', replaceText: 'omega', filter: { mode: 'current_frame', currentFrameId: 1 } });
assert.ok(preview.length >= 4);
assert.ok(preview.every((entry) => entry.frameId === 1));

const currentOnly = applyFindReplace({ frames, findText: 'alpha', replaceText: 'omega', filter: { mode: 'current_frame', currentFrameId: 1 } });
assert.equal(currentOnly.frames[0].content.title, 'omega Note');
assert.equal(currentOnly.frames[1].content.body, 'beta body alpha');
assert.ok(currentOnly.replacements > 0);

const allFrames = applyFindReplace({ frames, findText: 'alpha', replaceText: 'omega', filter: { mode: 'all_frames' } });
assert.equal(allFrames.frames[1].content.body, 'beta body omega');

const selected = applyFindReplace({ frames, findText: 'alpha', replaceText: 'omega', filter: { mode: 'selected_sections', selectedFrameIds: [2] } });
assert.equal(selected.frames[0].content.title, 'Alpha Note');
assert.equal(selected.frames[1].content.body, 'beta body omega');

console.log('test-find-replace-service: ok');
