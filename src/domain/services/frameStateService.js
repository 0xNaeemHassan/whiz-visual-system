export function initializeNewFrameState({
  resetContent,
  defaultContent,
  initializeFrameTemplate,
  frameId,
  resetOverrides,
  defaultOverrides,
  setBgGradient,
  setPatternOverlay,
  setTheme,
  activeTheme,
  setAspectRatio,
  defaultAspectRatio,
  showToast,
}) {
  resetContent(defaultContent);
  initializeFrameTemplate?.(frameId);
  resetOverrides(defaultOverrides);
  setBgGradient(null);
  setPatternOverlay(null);
  setTheme(activeTheme);
  setAspectRatio(defaultAspectRatio);
  showToast?.('New frame started');
}

export function resetDesignState({ resetOverrides, defaultOverrides, setBgGradient, setPatternOverlay, showToast }) {
  resetOverrides(defaultOverrides);
  setBgGradient(null);
  setPatternOverlay(null);
  showToast?.('Design reset to defaults');
}
