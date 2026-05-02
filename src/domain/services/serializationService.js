export function buildFrameSave({ frameId, theme, content, overrides, aspectRatio, bgGradient, patternOverlay }) {
  return { frameId, theme, content, overrides, aspectRatio, bgGradient, patternOverlay, savedAt: Date.now() };
}

export function parseImportedState(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid JSON');
  }
  return raw;
}
