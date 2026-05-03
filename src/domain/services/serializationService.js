import { normalizeContentTaxonomy } from '../../utils/contentNormalization';

export function buildFrameSave({ frameId, theme, content, overrides, aspectRatio, bgGradient, patternOverlay, workflowPhase = "draft", phaseChecklist = null, sectionLocks = {}, signoffRecord = null }) {
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
    sectionLocks,
    phaseChecklist: phaseChecklist || { draftAt: Date.now(), reviewAt: null, publishReadyAt: null, lastTransitionAt: Date.now() },
    signoffRecord,
    savedAt: Date.now(),
    saveMetadata,
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
    sectionLocks: raw.sectionLocks || null,
    telemetry: {
      ...(raw.telemetry || {}),
      taxonomyAutoCorrected: normalization.compliance.autoCorrected.length > 0,
      taxonomyInvalidCount: normalization.compliance.invalid.length,
    },
  };
}
