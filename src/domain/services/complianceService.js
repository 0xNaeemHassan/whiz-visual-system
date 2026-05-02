import { nearestTypeScale, getComplianceIssues, getBrandScore, resolveBigNumberHierarchy } from '../../utils/editorCompliance';

export function computeCompliance({ overrides, content }) {
  return getComplianceIssues({ overrides, content });
}

export function computeBrandScore({ overrides, content }) {
  return getBrandScore({ overrides, content });
}

export function strictPolishOverrides(prev, content = {}) {
  const hierarchy = resolveBigNumberHierarchy({
    bigValue: content.bigValue || '',
    unit: content.bigUnit || '',
    label: content.bigLabel || '',
    companionMetrics: Array.isArray(content?.stats) ? content.stats.length : 0,
  });

  return {
    ...prev,
    title: { ...(prev.title || {}), fontSize: nearestTypeScale(prev.title?.fontSize ?? 52) },
    deck: { ...(prev.deck || {}), fontSize: nearestTypeScale(prev.deck?.fontSize ?? 18) },
    body: { ...(prev.body || {}), fontSize: nearestTypeScale(prev.body?.fontSize ?? 15) },
    bigNumber: { ...(prev.bigNumber || {}), fontSize: hierarchy.big },
    bigUnit: { ...(prev.bigUnit || {}), fontSize: hierarchy.unit },
    bigLabel: { ...(prev.bigLabel || {}), fontSize: hierarchy.label },
  };
}
