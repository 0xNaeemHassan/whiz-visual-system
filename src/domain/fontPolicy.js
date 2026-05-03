const APPROVED_FONT_FAMILIES = {
  heading: ["'Space Grotesk', sans-serif"],
  body: ["'Inter', sans-serif"],
  mono: ["'JetBrains Mono', monospace"],
};

const APPROVED_FONT_SET = new Set(Object.values(APPROVED_FONT_FAMILIES).flat().map((font) => font.trim().toLowerCase()));

function normalizeFontValue(value, fallback) {
  if (!value || typeof value !== 'string') return fallback;
  return value.trim();
}

function resolveFont(role, candidate) {
  const approved = APPROVED_FONT_FAMILIES[role] || [];
  const normalizedCandidate = normalizeFontValue(candidate, approved[0]);
  const key = normalizedCandidate.toLowerCase();
  if (APPROVED_FONT_SET.has(key)) {
    return { fontFamily: normalizedCandidate, substituted: false, requested: normalizedCandidate };
  }
  return {
    fontFamily: approved[0],
    substituted: normalizedCandidate !== approved[0],
    requested: normalizedCandidate,
  };
}

export function resolveApprovedFontPairing(fontPairing = {}) {
  const heading = resolveFont('heading', fontPairing?.heading);
  const body = resolveFont('body', fontPairing?.body);
  const mono = resolveFont('mono', fontPairing?.mono);
  const substitutions = [
    ['heading', heading],
    ['body', body],
    ['mono', mono],
  ].filter(([, result]) => result.substituted)
    .map(([role, result]) => ({ role, requested: result.requested, fallback: result.fontFamily }));

  return {
    fonts: {
      heading: heading.fontFamily,
      body: body.fontFamily,
      mono: mono.fontFamily,
    },
    substitutions,
  };
}

export function warnFontSubstitutions(substitutions = [], logger = console.warn) {
  if (!substitutions.length) return;
  const mapping = substitutions.map(({ role, requested, fallback }) => `${role}: "${requested}" → "${fallback}"`).join(', ');
  logger(`[font-policy] Unavailable fonts substituted with approved fallbacks: ${mapping}`);
}
