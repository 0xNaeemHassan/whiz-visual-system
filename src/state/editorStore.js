import { perfLog, perfNow } from '../utils/perfProfiler';

export const STATIC_MEDIA_STATE = Object.freeze({
  uploadedImages: { logo: null, hero: null, badge: null },
  bgGradient: null,
  patternOverlay: null,
});

export function updateSliceImmutable(previousState, key, nextValue) {
  const resolved = typeof nextValue === 'function' ? nextValue(previousState[key]) : nextValue;
  if (Object.is(previousState[key], resolved)) return previousState;
  return { ...previousState, [key]: resolved };
}

export function createEditorSelectors() {
  let mediaStateRef = null;
  let mediaSelection = null;

  return {
    selectMediaSlices(mediaState) {
      if (mediaStateRef === mediaState && mediaSelection) return mediaSelection;
      mediaStateRef = mediaState;
      mediaSelection = {
        uploadedImages: mediaState?.uploadedImages || STATIC_MEDIA_STATE.uploadedImages,
        bgGradient: mediaState?.bgGradient || null,
        patternOverlay: mediaState?.patternOverlay || null,
      };
      return mediaSelection;
    },
  };
}

export function measureSelectorPhase(name, start, extra = {}) {
  const duration = perfNow() - start;
  perfLog(name, { tier: 'hot', metric: 'selector_ms', value: +duration.toFixed(2), extra });
}
