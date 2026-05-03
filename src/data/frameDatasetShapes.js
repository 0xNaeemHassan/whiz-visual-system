/**
 * Frame dataset schema metadata used for previews and compatibility checks.
 */

const EMPTY_SCHEMA = {
  dataset: 'generic',
  rowCount: null,
  fields: [],
  preview: 'Flexible content',
};

/** @type {Record<string, {dataset: string, rowCount: number|null, fields: Array<{name: string, type: string}>}>} */
export const LAYOUT_DATASET_SHAPES = {
  table: {
    dataset: 'table',
    rowCount: 8,
    fields: [
      { name: 'col1', type: 'string' },
      { name: 'col2', type: 'string' },
      { name: 'col3', type: 'string' },
      { name: 'col4', type: 'string' },
      { name: 'col5', type: 'string' },
    ],
  },
  scorecard: {
    dataset: 'table',
    rowCount: 8,
    fields: [
      { name: 'col1', type: 'string' },
      { name: 'col2', type: 'string' },
      { name: 'col3', type: 'grade' },
    ],
  },
  'tier-list': {
    dataset: 'table',
    rowCount: 10,
    fields: [
      { name: 'col1', type: 'string' },
      { name: 'col2', type: 'tier' },
    ],
  },
  timeline: {
    dataset: 'timeline',
    rowCount: 7,
    fields: [
      { name: 'date', type: 'date' },
      { name: 'event', type: 'string' },
      { name: 'impact', type: 'string' },
    ],
  },
  'bull-bear': {
    dataset: 'split',
    rowCount: 3,
    fields: [
      { name: 'bullPoint', type: 'string' },
      { name: 'bearPoint', type: 'string' },
    ],
  },
  grid: {
    dataset: 'grid',
    rowCount: 9,
    fields: [
      { name: 'title', type: 'string' },
      { name: 'metric', type: 'string' },
      { name: 'context', type: 'string' },
    ],
  },
  stats: {
    dataset: 'stats',
    rowCount: 4,
    fields: [
      { name: 'label', type: 'string' },
      { name: 'value', type: 'string' },
    ],
  },
};


const DEFAULT_CRITICAL_FIELD_RULES = Object.freeze({
  bigNumber: { enabled: true },
  stats: { enabled: true },
  table: { enabled: true },
  timeline: { enabled: true },
});

export const LAYOUT_CRITICAL_FIELD_REGISTRY = {
  default: DEFAULT_CRITICAL_FIELD_RULES,
  table: { ...DEFAULT_CRITICAL_FIELD_RULES, timeline: { enabled: false } },
  timeline: { ...DEFAULT_CRITICAL_FIELD_RULES, table: { enabled: false } },
};

export const LAYOUT_DATASET_CONSTRAINTS = Object.freeze({
  table: [
    { type: 'totalsReconciliation', severity: 'blocking', totalField: 'col5', partFields: ['col2', 'col3', 'col4'], tolerance: 0.01 },
    { type: 'percentageDenominator', severity: 'blocking', field: 'col4', denominatorField: 'col3' },
  ],
  scorecard: [
    { type: 'rankOrder', severity: 'blocking', field: 'col3', order: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'] },
  ],
  stats: [
    { type: 'sumTo100', severity: 'blocking', field: 'value', tolerance: 0.5 },
  ],
});

export function getCriticalFieldRegistry(layout) {
  return LAYOUT_CRITICAL_FIELD_REGISTRY[layout] || LAYOUT_CRITICAL_FIELD_REGISTRY.default;
}
export function getLayoutDatasetShape(layout) {
  return LAYOUT_DATASET_SHAPES[layout] || EMPTY_SCHEMA;
}

export function getExpectedDataPreview(layout) {
  const shape = getLayoutDatasetShape(layout);
  if (!shape.fields.length) return shape.preview;

  if (shape.dataset === 'table') {
    return `table: ${shape.fields.length} cols × ${shape.rowCount || 'n'} rows`;
  }

  return `${shape.dataset}: ${shape.fields.map((field) => field.name).join(' + ')}`;
}
