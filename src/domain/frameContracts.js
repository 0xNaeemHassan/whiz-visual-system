const MAX_TEXT_LENGTH = 280;

function textField(maxLength = MAX_TEXT_LENGTH) {
  return Object.freeze({ type: 'string', nonEmpty: true, maxLength });
}

const baseContract = Object.freeze({
  requiredMetadataFields: Object.freeze(['topicTag', 'title', 'deck']),
  requiredContent: Object.freeze([]),
  limits: Object.freeze({
    topicTag: textField(48),
    title: textField(120),
    deck: textField(220),
    body: textField(1500),
  }),
});

const layoutContracts = Object.freeze({
  table: Object.freeze({
    requiredContent: Object.freeze([
      Object.freeze({ path: 'tableRows', type: 'array', minItems: 1 }),
      Object.freeze({ path: 'tableRows[].col1', type: 'string', nonEmpty: true }),
    ]),
  }),
  stats: Object.freeze({
    requiredContent: Object.freeze([
      Object.freeze({ path: 'stats', type: 'array', minItems: 3 }),
      Object.freeze({ path: 'stats[].label', type: 'string', nonEmpty: true }),
      Object.freeze({ path: 'stats[].value', type: 'string', nonEmpty: true }),
    ]),
  }),
  scorecard: Object.freeze({
    requiredContent: Object.freeze([
      Object.freeze({ path: 'stats', type: 'array', minItems: 5 }),
      Object.freeze({ path: 'stats[].label', type: 'string', nonEmpty: true }),
      Object.freeze({ path: 'stats[].value', type: 'string', nonEmpty: true }),
    ]),
  }),
  timeline: Object.freeze({
    requiredContent: Object.freeze([
      Object.freeze({ path: 'tableRows', type: 'array', minItems: 3 }),
    ]),
  }),
});

const frameContractsById = Object.freeze({
  4: Object.freeze({
    requiredContent: Object.freeze([
      Object.freeze({ path: 'tableRows', type: 'array', minItems: 8 }),
    ]),
  }),
  7: Object.freeze({
    requiredContent: Object.freeze([
      Object.freeze({ path: 'tableRows', type: 'array', minItems: 4 }),
    ]),
  }),
  15: Object.freeze({
    requiredContent: Object.freeze([
      Object.freeze({ path: 'stats', type: 'array', minItems: 8 }),
    ]),
  }),
});

export const frameContracts = Object.freeze({
  base: baseContract,
  byLayout: layoutContracts,
  byFrameId: frameContractsById,
});

export function resolveFrameContract(frame) {
  const byLayout = frame?.layout ? frameContracts.byLayout[frame.layout] : null;
  const byFrameId = Number.isInteger(frame?.id) ? frameContracts.byFrameId[frame.id] : null;

  return Object.freeze({
    requiredMetadataFields: Object.freeze([
      ...(baseContract.requiredMetadataFields || []),
      ...(byLayout?.requiredMetadataFields || []),
      ...(byFrameId?.requiredMetadataFields || []),
    ]),
    requiredContent: Object.freeze([
      ...(baseContract.requiredContent || []),
      ...(byLayout?.requiredContent || []),
      ...(byFrameId?.requiredContent || []),
    ]),
    limits: Object.freeze({
      ...(baseContract.limits || {}),
      ...(byLayout?.limits || {}),
      ...(byFrameId?.limits || {}),
    }),
  });
}
