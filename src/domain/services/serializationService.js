import { normalizeContentTaxonomy } from '../../utils/contentNormalization';

export function buildFrameSave({ frameId, theme, content, overrides, aspectRatio, bgGradient, patternOverlay, workflowPhase = "draft", phaseChecklist = null }) {
  const normalization = normalizeContentTaxonomy(content || {});
  return {
    frameId,
    theme,
    content: normalization.content,
    overrides,
    aspectRatio,
    bgGradient,
    patternOverlay,
    workflowPhase,
    phaseChecklist: phaseChecklist || { draftAt: Date.now(), reviewAt: null, publishReadyAt: null, lastTransitionAt: Date.now() },
    savedAt: Date.now(),
    telemetry: {
      taxonomyAutoCorrected: normalization.compliance.autoCorrected.length > 0,
      taxonomyInvalidCount: normalization.compliance.invalid.length,
    },
  };
}

export function parseImportedState(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid JSON');
  }
  const normalization = normalizeContentTaxonomy(raw.content || {});
  return {
    ...raw,
    content: normalization.content,
    telemetry: {
      ...(raw.telemetry || {}),
      taxonomyAutoCorrected: normalization.compliance.autoCorrected.length > 0,
      taxonomyInvalidCount: normalization.compliance.invalid.length,
    },
  };
}
