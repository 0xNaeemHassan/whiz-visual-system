import {
  nearestTypeScale, getComplianceIssues, getBrandScore, getEditorValidationReport, SPACING_TOKENS, TABLE_STANDARD_TOKENS,
} from '../../utils/editorCompliance.js';
import { classifyProvenanceFreshness, FRESHNESS_STATUS, resolveMetricClassPolicy } from '../provenanceFreshnessPolicy.js';

export function computeCompliance({ overrides, content }) {
  return getComplianceIssues({ overrides, content });
}

export function computeBrandScore({ overrides, content }) {
  return getBrandScore({ overrides, content });
}

export function strictPolishOverrides(prev) {
  const nextGap = SPACING_TOKENS.gapPx.includes(prev?.layout?.gapPx) ? prev.layout.gapPx : 16;
  const nextSectionMargin = SPACING_TOKENS.sectionMarginPx.includes(prev?.layout?.sectionMarginPx) ? prev.layout.sectionMarginPx : 16;
  return {
    ...prev,
    title: { ...(prev.title || {}), fontSize: nearestTypeScale(prev.title?.fontSize ?? 52) },
    deck: { ...(prev.deck || {}), fontSize: nearestTypeScale(prev.deck?.fontSize ?? 18) },
    body: { ...(prev.body || {}), fontSize: nearestTypeScale(prev.body?.fontSize ?? 15) },
    layout: { ...(prev.layout || {}), gapPx: nextGap, sectionMarginPx: nextSectionMargin },
    table: {
      ...(prev.table || {}),
      borderStyle: TABLE_STANDARD_TOKENS.borderStyle,
      borderWidthPx: TABLE_STANDARD_TOKENS.borderWidthPx,
      rowHeightPx: TABLE_STANDARD_TOKENS.rowHeightPx,
      fontSizePx: TABLE_STANDARD_TOKENS.bodyFontSizePx,
    },
  };
}

export function computeEditorValidation({ overrides, content }) {
  return getEditorValidationReport({ overrides, content });
}


const hexToRgb = (hex = '') => {
  const normalized = String(hex).trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  const value = Number.parseInt(normalized, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
};

const relativeLuminance = ({ r, g, b }) => {
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return (0.2126 * channel(r)) + (0.7152 * channel(g)) + (0.0722 * channel(b));
};

const getContrastRatio = (fg, bg) => {
  const fgRgb = hexToRgb(fg);
  const bgRgb = hexToRgb(bg);
  if (!fgRgb || !bgRgb) return null;
  const l1 = relativeLuminance(fgRgb);
  const l2 = relativeLuminance(bgRgb);
  const [max, min] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (max + 0.05) / (min + 0.05);
};

export function runExportPreflight({ content = {}, overrides = {}, theme = {}, whizEffects = {} } = {}) {
  const checks = [];
  const add = (id, label, severity, passed, detail = '') => checks.push({ id, label, severity, passed, detail });
  const titleColor = overrides?.title?.color || '#F4F5F7';
  const bgColor = overrides?.frameBg || theme?.base || '#0F1318';
  const contrast = getContrastRatio(titleColor, bgColor);
  add('contrast', 'Contrast ratio', 'critical', contrast !== null && contrast >= 4.5, contrast === null ? 'Unable to compute contrast from non-hex colors.' : `ratio=${contrast.toFixed(2)}`);
  const missingLabels = (content?.stats || []).filter((item) => !String(item?.label || '').trim()).length;
  add('missing-labels', 'Missing labels', 'critical', missingLabels === 0, missingLabels ? `${missingLabels} unlabeled stats.` : '');
  const minFontSize = Math.min(overrides?.title?.fontSize || 52, overrides?.deck?.fontSize || 18, overrides?.body?.fontSize || 15);
  add('font-size-floor', 'Font size floor', 'critical', minFontSize >= 12, `minimum=${minFontSize}px`);
  add('motion-policy', 'Motion policy', 'warning', (content?.tickerSpeed ?? 28) <= 36, `tickerSpeed=${content?.tickerSpeed ?? 28}`);
  add('color-only-semantics', 'Color-only semantics', 'warning', Boolean(content?.topicTag || '').trim().length > 0, 'Add topic tag or semantic chips to avoid color-only cues.');
  const reducedMotion = whizEffects?.glow === false && whizEffects?.noise === false;
  add('reduced-motion-friendly', 'Reduced motion friendly', 'warning', reducedMotion, 'Disable glow/noise for lower motion surfaces.');
  const criticalFailures = checks.filter((c) => c.severity === 'critical' && !c.passed);
  const warnings = checks.filter((c) => c.severity === 'warning' && !c.passed);
  return { checks, passed: criticalFailures.length === 0, hasWarnings: warnings.length > 0, criticalFailures, warnings, generatedAt: new Date().toISOString() };
}


const TRUST_BLOCKING_SEVERITIES = new Set(['blocking']);

export function runTrustPreflightOrchestrator({ content = {}, strictMode = true, exceptionReason = '' } = {}) {
  const normalize = (value) => String(value || '').trim();
  const stats = Array.isArray(content?.stats) ? content.stats : [];
  const tableRows = Array.isArray(content?.tableRows) ? content.tableRows : [];
  const issues = [];
  const addIssue = (checkId, severity, fieldPath, message) => issues.push({ checkId, severity, fieldPath, message });

  const hasCompleteProvenance = (prov = {}) => Boolean(normalize(prov.source) && normalize(prov.date) && normalize(prov.confidence) && normalize(prov.links));
  stats.forEach((stat, idx) => { if (!hasCompleteProvenance(stat?.provenance)) addIssue('provenance-completeness', 'blocking', `content.stats[${idx}].provenance`, 'Stat provenance is incomplete.'); });
  tableRows.forEach((row, idx) => { if (!hasCompleteProvenance(row?.provenance)) addIssue('provenance-completeness', 'blocking', `content.tableRows[${idx}].provenance`, 'Table row provenance is incomplete.'); });

  const freshnessRows = [
    ...stats.map((x, idx) => ({ metricClass: 'market', provenance: x?.provenance, fieldPath: `content.stats[${idx}].provenance.date` })),
    ...tableRows.map((x, idx) => ({ metricClass: 'quarterlyFundamentals', provenance: x?.provenance, fieldPath: `content.tableRows[${idx}].provenance.date` })),
  ];
  freshnessRows.forEach(({ metricClass, provenance, fieldPath }) => {
    const freshness = classifyProvenanceFreshness({ provenance, metricClass });
    const policy = resolveMetricClassPolicy(metricClass);
    if (freshness.status === FRESHNESS_STATUS.STALE) {
      addIssue('freshness', policy.level, fieldPath, `Stale provenance for ${metricClass} (age ${freshness.ageDays}d, threshold ${freshness.maxAgeDays}d). Remediation: ${policy.remediation}`);
    }
    if (freshness.status === FRESHNESS_STATUS.FUTURE_DATE) {
      addIssue('freshness', 'warning', fieldPath, `Future-dated provenance for ${metricClass}. Remediation: ${policy.remediation}`);
    }
    if (freshness.status === FRESHNESS_STATUS.UNKNOWN) {
      addIssue('freshness', 'warning', fieldPath, `Missing/invalid provenance date for ${metricClass}. Remediation: ${policy.remediation}`);
    }
  });

  stats.forEach((stat, idx) => {
    const raw = normalize(stat?.value).replace(/[$,%\s,]/g, '');
    const n = Number(raw);
    if (Number.isFinite(n) && Math.abs(n) > 1_000_000_000_000) addIssue('outliers', 'warning', `content.stats[${idx}].value`, 'Value looks like an outlier and may need verification.');
  });

  const units = new Set();
  stats.forEach((stat, idx) => {
    const value = normalize(stat?.value);
    if (value.includes('%')) units.add('percent');
    if (value.includes('$')) units.add('currency');
    if (value.match(/\b(k|m|b|t)\b/i)) units.add('magnitude');
    if (units.size > 1) addIssue('unit-compatibility', 'warning', `content.stats[${idx}].value`, 'Mixed unit families detected across stats.');
  });

  stats.forEach((stat, idx) => {
    const label = normalize(stat?.label).toLowerCase();
    const value = normalize(stat?.value);
    if ((label.includes('apy') || label.includes('rate') || label.includes('%')) && !value.includes('%')) addIssue('impossible-combinations', 'blocking', `content.stats[${idx}].value`, 'Rate-like labels should include percentage values.');
  });

  const seen = new Map();
  stats.forEach((stat, idx) => {
    const key = `${normalize(stat?.label).toLowerCase()}::${normalize(stat?.value).toLowerCase()}`;
    if (!key || key === '::') return;
    if (seen.has(key)) addIssue('duplicates', 'warning', `content.stats[${idx}]`, `Duplicate stat also appears at index ${seen.get(key)}.`);
    else seen.set(key, idx);
  });

  const blocking = issues.filter((issue) => TRUST_BLOCKING_SEVERITIES.has(issue.severity));
  const warnings = issues.filter((issue) => issue.severity === 'warning');
  const bypassed = !strictMode && blocking.length > 0;
  return {
    strictMode,
    exceptionReason: bypassed ? normalize(exceptionReason) || 'non-strict mode override' : '',
    checks: {
      'provenance-completeness': issues.filter((x) => x.checkId === 'provenance-completeness'),
      freshness: issues.filter((x) => x.checkId === 'freshness'),
      outliers: issues.filter((x) => x.checkId === 'outliers'),
      'unit-compatibility': issues.filter((x) => x.checkId === 'unit-compatibility'),
      'impossible-combinations': issues.filter((x) => x.checkId === 'impossible-combinations'),
      duplicates: issues.filter((x) => x.checkId === 'duplicates'),
    },
    blocking,
    warnings,
    canProceed: blocking.length === 0 || !strictMode,
    generatedAt: new Date().toISOString(),
  };
}
