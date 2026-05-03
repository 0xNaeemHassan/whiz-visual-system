import type { FrameContent, StyleOverrides } from '../../types/canonical';

type InitializeFrameStateArgs = {
  resetContent: (content: FrameContent) => void;
  defaultContent: FrameContent;
  initializeFrameTemplate?: (frameId: number) => void;
  frameId: number;
  resetOverrides: (overrides: StyleOverrides) => void;
  defaultOverrides: StyleOverrides;
  setBgGradient: (value: string | null) => void;
  setPatternOverlay: (value: string | null) => void;
  setTheme: (theme: unknown) => void;
  activeTheme: unknown;
  setAspectRatio: (ratio: { w: number; h: number; label?: string }) => void;
  defaultAspectRatio: { w: number; h: number; label?: string };
  showToast?: (message: string) => void;
};

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
}: InitializeFrameStateArgs): void {
  resetContent(defaultContent);
  initializeFrameTemplate?.(frameId);
  resetOverrides(defaultOverrides);
  setBgGradient(null);
  setPatternOverlay(null);
  setTheme(activeTheme);
  setAspectRatio(defaultAspectRatio);
  showToast?.('New frame started');
}

export function resetDesignState({
  resetOverrides,
  defaultOverrides,
  setBgGradient,
  setPatternOverlay,
  showToast,
}: Pick<
  InitializeFrameStateArgs,
  'resetOverrides' | 'defaultOverrides' | 'setBgGradient' | 'setPatternOverlay' | 'showToast'
>): void {
  resetOverrides(defaultOverrides);
  setBgGradient(null);
  setPatternOverlay(null);
  showToast?.('Design reset to defaults');
}
