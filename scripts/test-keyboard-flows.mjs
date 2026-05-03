import assert from 'node:assert/strict';
import fs from 'node:fs';

const editor = fs.readFileSync('src/pages/Editor.jsx', 'utf8');
const patternSelector = fs.readFileSync('src/components/PatternSelector.jsx', 'utf8');
const imageUpload = fs.readFileSync('src/components/ImageUpload.jsx', 'utf8');

assert.ok(editor.includes('setShowMobileCommandSheet(false);'), 'Escape should close mobile command sheet.');
assert.ok(editor.includes('setShowCommandPalette(false);'), 'Escape should close command palette.');
assert.ok(editor.includes('Publish PNG'), 'Mobile command sheet should keep publish action available.');

assert.ok(patternSelector.includes('handlePatternKeyDown'), 'Pattern selector should define roving keyboard handler.');
assert.ok(patternSelector.includes('ArrowRight') && patternSelector.includes('ArrowLeft'), 'Pattern selector should support arrow-key navigation.');
assert.ok(imageUpload.includes('handleRovingKeyDown'), 'Image upload should define roving keyboard handler.');
assert.ok(imageUpload.includes("e.key === 'Enter' || e.key === ' '"), 'Image upload trigger should support Enter/Space activation.');

console.log('Keyboard-only flow regression checks passed');
