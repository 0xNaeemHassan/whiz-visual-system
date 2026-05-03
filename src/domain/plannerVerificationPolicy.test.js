import { describe, it, expect } from 'vitest';
import { attachVerificationPlan, evaluateVerificationStatus, canPublishIssue, buildOverrideAuditLog } from './plannerVerificationPolicy';

describe('planner verification SLA policies', () => {
  it('attaches SLA policy based on claim type', () => {
    const planned = attachVerificationPlan({ id: 'i1', claimType: 'fast_metrics', createdAt: '2026-05-01T00:00:00.000Z' }, new Date('2026-05-01T00:00:00.000Z'));
    expect(planned.verificationPolicy.verifyWithinHours).toBe(12);
    expect(planned.verificationPolicy.critical).toBe(true);
  });

  it('emits warning/escalation reminders as deadline approaches', () => {
    const planned = attachVerificationPlan({ id: 'i2', claimType: 'slower_indicators', createdAt: '2026-05-01T00:00:00.000Z' }, new Date('2026-05-01T00:00:00.000Z'));
    const status = evaluateVerificationStatus(planned, new Date('2026-05-03T23:00:00.000Z'));
    expect(status.reminders).toContain('verification_due_soon');
    expect(status.reminders).toContain('verification_escalation');
  });

  it('blocks publish for expired critical verification without override', () => {
    const planned = attachVerificationPlan({ id: 'i3', claimType: 'fast_metrics', createdAt: '2026-05-01T00:00:00.000Z' }, new Date('2026-05-01T00:00:00.000Z'));
    const gate = canPublishIssue(planned, new Date('2026-05-02T14:00:00.000Z'));
    expect(gate.allowed).toBe(false);
  });

  it('allows publish with expired critical verification when override approved and logs audit event', () => {
    const planned = attachVerificationPlan({ id: 'i4', claimType: 'fast_metrics', createdAt: '2026-05-01T00:00:00.000Z', verification: { overrideApproved: true } }, new Date('2026-05-01T00:00:00.000Z'));
    const gate = canPublishIssue(planned, new Date('2026-05-02T14:00:00.000Z'));
    expect(gate.allowed).toBe(true);
    expect(gate.overrideLogged).toBe(true);
    const log = buildOverrideAuditLog({ issueId: 'i4', actor: 'qa', reason: 'Breaking market event', now: new Date('2026-05-02T14:00:00.000Z') });
    expect(log.action).toBe('verification_override');
    expect(log.reason).toBe('Breaking market event');
  });
});
