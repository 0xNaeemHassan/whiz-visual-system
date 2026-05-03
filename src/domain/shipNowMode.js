const SHIP_NOW_SAFE_EFFECTS = Object.freeze({
  grain: false,
  glow: false,
  vignette: false,
  scanlines: false,
  noise: false,
});

export const SHIP_NOW_DEFAULTS = Object.freeze({
  workflowPhase: 'review',
  uiExperienceMode: 'novice',
  strictMode: true,
  exportPresetId: 'standard',
  frameValidationMode: 'validated',
  typographyThemeMode: 'constrained',
  sourceChecks: 'required',
  effectMode: 'minimal',
});

export function applyShipNowDefaults(current = {}) {
  return {
    ...current,
    uiExperienceMode: SHIP_NOW_DEFAULTS.uiExperienceMode,
    workflowPhase: SHIP_NOW_DEFAULTS.workflowPhase,
    strictMode: SHIP_NOW_DEFAULTS.strictMode,
    exportPresetId: SHIP_NOW_DEFAULTS.exportPresetId,
    whizEffects: { ...(current.whizEffects || {}), ...SHIP_NOW_SAFE_EFFECTS },
  };
}

export function getShipNowBlockers({ stateValidation, editorValidation, complianceIssues = [], hasRequiredSources = true }) {
  const blockers = [];
  if (!stateValidation?.valid) blockers.push('State validation has blocking errors.');
  if ((editorValidation?.errors || []).length > 0) blockers.push(`Editor validation has ${(editorValidation?.errors || []).length} blocking error(s).`);
  if ((complianceIssues || []).length > 0) blockers.push(`Compliance has ${(complianceIssues || []).length} blocking issue(s).`);
  if (!hasRequiredSources) blockers.push('Critical source/provenance checks are failing.');
  return blockers;
}
