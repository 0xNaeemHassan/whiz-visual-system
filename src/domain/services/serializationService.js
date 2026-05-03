import { normalizeContentTaxonomy } from '../../utils/contentNormalization';

export function buildFrameSave({ frameId, theme, content, overrides, aspectRatio, bgGradient, patternOverlay, saveMetadata = {} }) {
  const normalization = normalizeContentTaxonomy(content || {});
  return {
    frameId,
    theme,
    content: normalization.content,
    overrides,
    aspectRatio,
    bgGradient,
    patternOverlay,
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
    saveMetadata: raw.saveMetadata || {},
    telemetry: {
      ...(raw.telemetry || {}),
      taxonomyAutoCorrected: normalization.compliance.autoCorrected.length > 0,
      taxonomyInvalidCount: normalization.compliance.invalid.length,
    },
  };
}
