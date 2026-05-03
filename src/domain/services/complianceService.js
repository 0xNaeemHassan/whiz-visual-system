import {
  nearestTypeScale, getComplianceIssues, getBrandScore, getEditorValidationReport, SPACING_TOKENS, TABLE_STANDARD_TOKENS,
} from '../../utils/editorCompliance.js';

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
