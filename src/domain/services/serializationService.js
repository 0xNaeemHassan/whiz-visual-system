import { normalizeContentTaxonomy } from '../../utils/contentNormalization';

export function buildFrameSave({ frameId, theme, content, overrides, aspectRatio, bgGradient, patternOverlay, tags = [], folder = '', status }) {
  const normalization = normalizeContentTaxonomy(content || {});
  return {
    frameId,
    theme,
    content: normalization.content,
    overrides,
    aspectRatio,
    bgGradient,
    patternOverlay,
    tags: Array.isArray(tags) ? tags : [],
    folder: typeof folder === 'string' ? folder : '',
    ...(status ? { status } : {}),
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
