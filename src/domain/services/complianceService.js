import { nearestTypeScale, getComplianceIssues, getBrandScore } from '../../utils/editorCompliance';

export function computeCompliance({ overrides, content }) {
  return getComplianceIssues({ overrides, content });
}

export function computeBrandScore({ overrides, content }) {
  return getBrandScore({ overrides, content });
}

export function strictPolishOverrides(prev) {
  return {
    ...prev,
    title: { ...(prev.title || {}), fontSize: nearestTypeScale(prev.title?.fontSize ?? 52) },
    deck: { ...(prev.deck || {}), fontSize: nearestTypeScale(prev.deck?.fontSize ?? 18) },
    body: { ...(prev.body || {}), fontSize: nearestTypeScale(prev.body?.fontSize ?? 15) },
  };
}
