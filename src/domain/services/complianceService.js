import {
  nearestTypeScale, getComplianceIssues, getBrandScore, SPACING_TOKENS, TABLE_STANDARD_TOKENS,
} from '../../utils/editorCompliance';

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
