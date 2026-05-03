export const DOMAIN_ROLES = Object.freeze({
  CONTRIBUTOR: 'contributor',
  REVIEWER: 'reviewer',
  PUBLISHER: 'publisher',
});

export const ROLE_ORDER = [DOMAIN_ROLES.CONTRIBUTOR, DOMAIN_ROLES.REVIEWER, DOMAIN_ROLES.PUBLISHER];

export const ROLE_LABELS = Object.freeze({
  [DOMAIN_ROLES.CONTRIBUTOR]: 'Contributor',
  [DOMAIN_ROLES.REVIEWER]: 'Reviewer',
  [DOMAIN_ROLES.PUBLISHER]: 'Publisher',
});

const ALL = new Set(['edit-content', 'edit-design', 'run-readiness', 'export-assets', 'publish']);

const ROLE_CAPABILITIES = Object.freeze({
  [DOMAIN_ROLES.CONTRIBUTOR]: new Set(['edit-content', 'edit-design']),
  [DOMAIN_ROLES.REVIEWER]: new Set(['edit-content', 'edit-design', 'run-readiness']),
  [DOMAIN_ROLES.PUBLISHER]: ALL,
});

export function canRole(role, capability) {
  return Boolean(ROLE_CAPABILITIES[role]?.has(capability));
}

export function getRoleDisableReason(role, capability) {
  if (canRole(role, capability)) return '';
  if (capability === 'run-readiness') return 'Only reviewers and publishers can run readiness checks.';
  if (capability === 'export-assets') return 'Only publishers can export assets.';
  if (capability === 'publish') return 'Only publishers can publish manifests.';
  return `${ROLE_LABELS[role] || 'Selected role'} is not allowed to do this action.`;
}
