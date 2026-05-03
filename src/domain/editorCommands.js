const normalizeShortcut = (shortcut = '') => shortcut.toLowerCase().replace(/\s+/g, '');

export const matchesShortcut = (event, shortcut) => {
  if (!shortcut) return false;
  const combo = normalizeShortcut(shortcut);
  const wantsMeta = combo.includes('cmd') || combo.includes('meta');
  const wantsCtrl = combo.includes('ctrl');
  const wantsShift = combo.includes('shift');
  const wantsAlt = combo.includes('alt') || combo.includes('option');
  const keyMatch = combo.match(/\+([a-z0-9])$/i);
  const expectedKey = keyMatch ? keyMatch[1] : combo.slice(-1);
  const actualKey = String(event.key || '').toLowerCase();

  if (wantsMeta !== Boolean(event.metaKey)) return false;
  if (wantsCtrl !== Boolean(event.ctrlKey)) return false;
  if (wantsShift !== Boolean(event.shiftKey)) return false;
  if (wantsAlt !== Boolean(event.altKey)) return false;
  return actualKey === expectedKey;
};

const scoreQuery = (text, query) => {
  if (!query) return 0;
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  if (normalizedText.includes(normalizedQuery)) return normalizedQuery.length * 4;

  let score = 0;
  let cursor = 0;
  for (const char of normalizedQuery) {
    const position = normalizedText.indexOf(char, cursor);
    if (position === -1) return -1;
    score += position === cursor ? 3 : 1;
    cursor = position + 1;
  }
  return score;
};

export const filterCommands = (commands, query) => {
  const cleanQuery = query.trim();
  if (!cleanQuery) return commands;
  return commands
    .map((command) => {
      const haystack = [command.label, command.category, command.keywords || ''].join(' ');
      return { command, score: scoreQuery(haystack, cleanQuery) };
    })
    .filter(({ score }) => score >= 0)
    .sort((left, right) => right.score - left.score)
    .map(({ command }) => command);
};

export const createEditorCommandRegistry = (ctx) => [
  { id: 'palette.open', category: 'Navigation', label: 'Open Command Palette', shortcut: 'Cmd+K', handler: ctx.openPalette, enabled: () => true, keywords: 'search quick' },
  { id: 'save', category: 'File', label: 'Save Frame', shortcut: 'Cmd+S', handler: ctx.save, enabled: () => true, keywords: 'persist store' },
  { id: 'load', category: 'File', label: 'Load Save', shortcut: 'Cmd+L', handler: ctx.load, enabled: ctx.hasSaves, keywords: 'restore history' },
  { id: 'export.png', category: 'Export', label: 'Export PNG', shortcut: 'Cmd+E', handler: ctx.exportPng, enabled: () => true, keywords: 'image download' },
  { id: 'export.webp', category: 'Export', label: 'Export WebP', shortcut: 'Cmd+Shift+E', handler: ctx.exportWebp, enabled: () => true, keywords: 'image modern' },
  { id: 'duplicate', category: 'Edit', label: 'Duplicate Save', shortcut: 'Cmd+D', handler: ctx.duplicate, enabled: () => true, keywords: 'copy clone' },
  { id: 'frame.next', category: 'Navigation', label: 'Next Frame', shortcut: 'Alt+]', handler: ctx.nextFrame, enabled: () => true, keywords: 'switch cycle' },
  { id: 'frame.prev', category: 'Navigation', label: 'Previous Frame', shortcut: 'Alt+[', handler: ctx.prevFrame, enabled: () => true, keywords: 'switch cycle' },
  { id: 'validation.run', category: 'Validation', label: 'Run Validation Check', shortcut: 'Cmd+Shift+V', handler: ctx.validate, enabled: () => true, keywords: 'errors warnings compliance' },
  { id: 'strict.toggle', category: 'Validation', label: 'Toggle Strict Mode', shortcut: 'Cmd+Shift+M', handler: ctx.toggleStrict, enabled: () => true, keywords: 'policy compliance mode' },
  { id: 'history.undo', category: 'Edit', label: 'Undo', shortcut: 'Cmd+Z', handler: ctx.undo, enabled: ctx.canUndoAny, keywords: 'history back' },
  { id: 'history.redo', category: 'Edit', label: 'Redo', shortcut: 'Cmd+Shift+Z', handler: ctx.redo, enabled: ctx.canRedoAny, keywords: 'history forward' },
];
