export const SPINE_DESIGN_TOKENS = Object.freeze({
  position: Object.freeze({
    barLeftPx: 0,
    barTopPx: 0,
    labelWrapLeftPx: 5,
    labelWrapTopPx: 0,
  }),
  geometry: Object.freeze({
    barWidthPx: 5,
    labelWrapWidthPx: 18,
    cornerSizePx: 16,
    cornerOffsetPx: 12,
    cornerStrokePx: 1.5,
  }),
  label: Object.freeze({
    rotationDeg: -90,
    fontSizePx: 12,
    letterSpacingEm: 0.16,
    fontWeight: 600,
    opacity: 0.55,
    textTransform: 'uppercase',
  }),
  contrast: Object.freeze({
    minRatio: 4.5,
  }),
  semantic: Object.freeze({
    textPrimary: '#F4F6FA',
    textSecondary: '#D3DAE6',
    textMuted: '#A4AFBF',
    textStatus: '#B9C6D9',
    bgSurface: '#0F1117',
    bgElevated: '#161922',
    bgMuted: '#1C2030',
  }),
});
