export const TICKER_CONTRACT = {
  heightPx: 28,
  speed: {
    min: 10,
    max: 60,
    step: 2,
    default: 28,
  },
  typography: {
    fontFamily: "'JetBrains Mono', 'SFMono-Regular', 'Cascadia Mono', 'Roboto Mono', 'Consolas', 'Liberation Mono', monospace",
    fontSizePx: 9,
    fontWeight: 500,
    letterSpacingEm: 0.08,
    textTransform: 'uppercase',
  },
  separator: ' ▸ ',
  background: {
    default: 'rgba(0,0,0,0.5)',
  },
  padding: {
    textInlineStartPct: 100,
  },
};

export function normalizeTickerSpeed(value) {
  const { min, max, step, default: fallback } = TICKER_CONTRACT.speed;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  const clamped = Math.min(max, Math.max(min, numeric));
  const snapped = Math.round((clamped - min) / step) * step + min;
  return Math.min(max, Math.max(min, snapped));
}
