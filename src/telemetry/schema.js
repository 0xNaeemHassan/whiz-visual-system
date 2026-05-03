export const TELEMETRY_VERSION = '1.0.0';

export const TELEMETRY_EVENTS = {
  LOAD: 'editor.load',
  SAVE: 'editor.save',
  ACTION_BAR: 'editor.action_bar',
  UNDO: 'editor.undo',
  REDO: 'editor.redo',
  EXPORT_SUCCESS: 'editor.export.success',
  EXPORT_FAILURE: 'editor.export.failure',
  EXPORT_BLOCKED_PROVENANCE: 'editor.export.blocked.provenance',
  VALIDATION_ERROR: 'editor.validation.error',
  DUPLICATE_AUTOPILOT_METRIC: 'editor.duplicate.autopilot.metric',
  DUPLICATE_RESOLUTION: 'editor.duplicate.resolution',
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
  [TELEMETRY_EVENTS.ACTION_BAR]: {
    action: 'save|load|duplicate|export|import|undo|redo',
    group: 'primary|overflow',
    surface: 'desktop|mobile',
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
  [TELEMETRY_EVENTS.EXPORT_BLOCKED_PROVENANCE]: {
    format: 'png|webp|html|json|manifest',
    issueCount: 'number',
    issuePaths: 'string[]',
  },
  [TELEMETRY_EVENTS.VALIDATION_ERROR]: {
    context: 'export|import',
    count: 'number',
    issues: 'string[]',
    taxonomyAutoCorrected: 'boolean?',
  },
  [TELEMETRY_EVENTS.DUPLICATE_AUTOPILOT_METRIC]: {
    stage: 'duplicated|issue_draft_created',
    completed: 'boolean',
    withWizard: 'boolean',
    confidence: 'low|medium|high?',
    provenanceRequired: 'boolean?',
  },
  [TELEMETRY_EVENTS.DUPLICATE_RESOLUTION]: {
    source: 'import_validate|row_edit|resolution',
    duplicateGroups: 'number',
    fuzzyPairs: 'number',
    unresolvedHighConfidence: 'number',
    action: 'merge|keep_both?',
  },
};

export const REQUIRED_METADATA_FIELDS = ['frameId', 'layout', 'version', 'timestamp'];
