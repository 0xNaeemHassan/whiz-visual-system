function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

export function validateEditorImport(raw) {
  const errors = [];

  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, errors: ['payload must be an object'] };
  }

  if (raw.content !== undefined && !isPlainObject(raw.content)) {
    errors.push('content must be an object');
  }

  if (raw.overrides !== undefined && !isPlainObject(raw.overrides)) {
    errors.push('overrides must be an object');
  }

  return { valid: errors.length === 0, errors };
}

export function normalizeEditorImport(raw = {}) {
  const safeRaw = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  return {
    content: isPlainObject(safeRaw.content) ? safeRaw.content : {},
    overrides: isPlainObject(safeRaw.overrides) ? safeRaw.overrides : {},
  };
}

export function normalizePlannerIssue(raw = {}) {
  const issue = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const outcomes = issue.outcomes && typeof issue.outcomes === 'object' && !Array.isArray(issue.outcomes) ? issue.outcomes : {};
  return {
    ...issue,
    metricSource: String(issue.metricSource || '').trim(),
    metricValue: String(issue.metricValue || '').trim(),
    metricUnit: String(issue.metricUnit || '').trim(),
    metricProvenance: Array.isArray(issue.metricProvenance) ? issue.metricProvenance : [],
    outcomes: {
      engagementRate: Number.isFinite(Number(outcomes.engagementRate)) ? Number(outcomes.engagementRate) : null,
      conversionProxy: Number.isFinite(Number(outcomes.conversionProxy)) ? Number(outcomes.conversionProxy) : null,
      qualitativeNotes: String(outcomes.qualitativeNotes || '').trim(),
      recordedAt: outcomes.recordedAt ? String(outcomes.recordedAt) : null,
    },
  };
}

export function validatePlannerIssue(raw = {}) {
  const issue = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const errors = [];
  if (issue.metricProvenance !== undefined && !Array.isArray(issue.metricProvenance)) {
    errors.push('metricProvenance must be an array');
  }
  for (const key of ['metricSource', 'metricValue', 'metricUnit']) {
    if (issue[key] !== undefined && typeof issue[key] !== 'string') {
      errors.push(`${key} must be a string`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export { isPlainObject };
