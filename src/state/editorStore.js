import { perfLog, perfNow } from '../utils/perfProfiler';

export const STATIC_MEDIA_STATE = Object.freeze({
  uploadedImages: { logo: null, hero: null, badge: null },
  bgGradient: null,
  patternOverlay: null,
});

export const DEFAULT_CADENCE_CONFIG = Object.freeze({
  days: [1, 3, 5],
  timezone: 'UTC',
  graceWindowHours: 12,
  weekStartsOn: 1,
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

export function setCadenceConfig(state, nextConfig = {}) {
  return {
    ...state,
    cadenceConfig: {
      ...DEFAULT_CADENCE_CONFIG,
      ...(state?.cadenceConfig || {}),
      ...nextConfig,
    },
  };
}

export function setCadenceDebt(state, debtCounter) {
  return {
    ...state,
    cadenceDebt: Math.max(0, Number(debtCounter) || 0),
  };
}

export function addCadenceOverride(state, { reason = '', actor = 'planner-ui', timestamp = Date.now() } = {}) {
  const override = { reason: String(reason || '').trim(), actor, timestamp };
  return {
    ...state,
    cadenceOverrides: [...(Array.isArray(state?.cadenceOverrides) ? state.cadenceOverrides : []), override],
  };
}

export function measureSelectorPhase(name, start, extra = {}) {
  const duration = perfNow() - start;
  perfLog(name, { tier: 'hot', metric: 'selector_ms', value: +duration.toFixed(2), extra });
}
