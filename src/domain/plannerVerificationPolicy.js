const DAY_MS = 24 * 60 * 60 * 1000;

export const CLAIM_TYPE_SLA = {
  fast_metrics: { label: 'Fast-moving metrics', verifyWithinHours: 12, warningHours: 6, escalateHours: 12, critical: true },
  slower_indicators: { label: 'Slower indicators', verifyWithinHours: 72, warningHours: 24, escalateHours: 72, critical: false },
  evergreen_context: { label: 'Evergreen context', verifyWithinHours: 168, warningHours: 48, escalateHours: 168, critical: false },
};

const DEFAULT_CLAIM_TYPE = 'slower_indicators';

export function resolveClaimTypePolicy(claimType) {
  return CLAIM_TYPE_SLA[claimType] || CLAIM_TYPE_SLA[DEFAULT_CLAIM_TYPE];
}

export function attachVerificationPlan(issue, now = new Date()) {
  const createdAtMs = Number.isFinite(new Date(issue?.createdAt).getTime()) ? new Date(issue.createdAt).getTime() : now.getTime();
  const claimType = issue?.claimType || DEFAULT_CLAIM_TYPE;
  const policy = resolveClaimTypePolicy(claimType);
  const dueAt = new Date(createdAtMs + (policy.verifyWithinHours * 60 * 60 * 1000)).toISOString();
  return {
    ...issue,
    claimType,
    verificationPolicy: {
      claimType,
      label: policy.label,
      verifyWithinHours: policy.verifyWithinHours,
      warningHours: policy.warningHours,
      escalateHours: policy.escalateHours,
      critical: policy.critical,
      dueAt,
    },
  };
}

export function evaluateVerificationStatus(issue, now = new Date()) {
  const policyIssue = issue?.verificationPolicy ? issue : attachVerificationPlan(issue, now);
  const verifiedAt = policyIssue?.verification?.verifiedAt ? new Date(policyIssue.verification.verifiedAt).getTime() : null;
  if (verifiedAt && verifiedAt <= now.getTime()) {
    return { level: 'verified', expired: false, reminders: [] };
  }
  const dueAtMs = new Date(policyIssue.verificationPolicy.dueAt).getTime();
  const hoursToDue = (dueAtMs - now.getTime()) / (60 * 60 * 1000);
  const reminders = [];
  let level = 'ok';
  if (hoursToDue <= 0) {
    level = 'expired';
    reminders.push('verification_expired');
  } else if (hoursToDue <= policyIssue.verificationPolicy.warningHours) {
    level = 'warning';
    reminders.push('verification_due_soon');
  }
  if (hoursToDue <= policyIssue.verificationPolicy.escalateHours) {
    reminders.push('verification_escalation');
  }
  return { level, expired: level === 'expired', reminders, hoursToDue: Math.round(hoursToDue * 10) / 10 };
}

export function canPublishIssue(issue, now = new Date()) {
  const status = evaluateVerificationStatus(issue, now);
  const isCritical = Boolean(issue?.verificationPolicy?.critical ?? resolveClaimTypePolicy(issue?.claimType).critical);
  const override = Boolean(issue?.verification?.overrideApproved);
  if (status.expired && isCritical && !override) {
    return { allowed: false, reason: 'Critical verification expired. Override approval required.', overrideLogged: false };
  }
  if (status.expired && isCritical && override) {
    return { allowed: true, reason: 'Critical verification expired with approved override.', overrideLogged: true };
  }
  return { allowed: true, reason: status.level === 'warning' ? 'Verification deadline approaching.' : 'Verification policy satisfied.', overrideLogged: false };
}

export function buildOverrideAuditLog({ issueId, actor = 'unknown', reason = '', now = new Date() }) {
  return {
    id: `override_${issueId || 'issue'}_${now.getTime()}`,
    issueId: issueId || '',
    actor,
    action: 'verification_override',
    reason: String(reason || '').trim(),
    timestamp: now.toISOString(),
  };
}
