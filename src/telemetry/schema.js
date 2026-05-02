export const TELEMETRY_VERSION = '1.0.0';

export const TELEMETRY_EVENTS = {
  LOAD: 'editor.load',
  SAVE: 'editor.save',
  UNDO: 'editor.undo',
  REDO: 'editor.redo',
  EXPORT_SUCCESS: 'editor.export.success',
  EXPORT_FAILURE: 'editor.export.failure',
  VALIDATION_ERROR: 'editor.validation.error',
};

export const EVENT_PAYLOAD_SHAPES = {
  [TELEMETRY_EVENTS.LOAD]: {
    source: 'manual|autosave|import',
    saveId: 'string?',
    taxonomyAutoCorrected: 'boolean?',
  },
  [TELEMETRY_EVENTS.SAVE]: {
    saveId: 'string',
    saveName: 'string',
  },
  [TELEMETRY_EVENTS.UNDO]: {
    scope: 'content|overrides',
  },
  [TELEMETRY_EVENTS.REDO]: {
    scope: 'content|overrides',
  },
  [TELEMETRY_EVENTS.EXPORT_SUCCESS]: {
    format: 'png|webp|html|json|manifest',
    strictMode: 'boolean',
    taxonomyAutoCorrected: 'boolean?',
  },
  [TELEMETRY_EVENTS.EXPORT_FAILURE]: {
    format: 'png|webp',
    reason: 'string',
    strictMode: 'boolean',
  },
  [TELEMETRY_EVENTS.VALIDATION_ERROR]: {
    context: 'export|import',
    count: 'number',
    issues: 'string[]',
    taxonomyAutoCorrected: 'boolean?',
  },
};

export const REQUIRED_METADATA_FIELDS = ['frameId', 'layout', 'version', 'timestamp'];
