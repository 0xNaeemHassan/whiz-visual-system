import { describe, it, expect } from 'vitest';
import { applyShipNowDefaults, getShipNowBlockers } from './shipNowMode';

describe('ship now mode', () => {
  it('applies safe defaults and minimal effects', () => {
    const next = applyShipNowDefaults({ uiExperienceMode: 'expert', strictMode: false, workflowPhase: 'draft', whizEffects: { glow: true } });
    expect(next.uiExperienceMode).toBe('novice');
    expect(next.strictMode).toBe(true);
    expect(next.workflowPhase).toBe('review');
    expect(next.exportPresetId).toBe('standard');
    expect(next.whizEffects.glow).toBe(false);
  });

  it('cannot bypass critical validation blockers', () => {
    const blockers = getShipNowBlockers({
      stateValidation: { valid: true },
      editorValidation: { errors: [] },
      complianceIssues: [],
      hasRequiredSources: false,
    });
    expect(blockers).toContain('Critical source/provenance checks are failing.');
  });
});
