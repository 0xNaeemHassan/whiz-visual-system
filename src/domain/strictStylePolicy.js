const STRICT_STYLE_ALLOWLIST = new Set([
  'spineColor',
  'tickerColor',
  'tickerBg',
  'title.color',
  'title.fontSize',
  'title.fontWeight',
  'title.lineHeight',
  'title.letterSpacing',
  'title.textAlign',
  'title.opacity',
  'deck.color',
  'deck.fontSize',
  'deck.fontWeight',
  'body.color',
  'body.fontSize',
  'body.lineHeight',
  'body.opacity',
  'tag.color',
  'tag.borderColor',
  'tag.background',
  'statsColor',
  'bignumColor',
  'footer.background',
  'avatarColor',
  'accent.color',
]);

const STRICT_BLOCK_REASON = 'Strict Whiz Mode blocks this design override for brand consistency.';

const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

export function isStrictStylePathAllowed(path) {
  return STRICT_STYLE_ALLOWLIST.has(path);
}

export function getStrictStyleBlockReason(path) {
  return isStrictStylePathAllowed(path)
    ? null
    : `${STRICT_BLOCK_REASON} (${path})`;
}

export function sanitizeStrictStyleOverrides(overrides) {
  if (!isObject(overrides)) return overrides;
  const next = {};
  Object.entries(overrides).forEach(([key, value]) => {
    if (isObject(value)) {
      const child = {};
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        if (isStrictStylePathAllowed(`${key}.${nestedKey}`)) child[nestedKey] = nestedValue;
      });
      if (Object.keys(child).length) next[key] = child;
      return;
    }
    if (isStrictStylePathAllowed(key)) next[key] = value;
  });
  return next;
}

export function collectStrictStyleViolations(overrides, basePath = '') {
  if (!isObject(overrides)) return [];
  const violations = [];
  Object.entries(overrides).forEach(([key, value]) => {
    const path = basePath ? `${basePath}.${key}` : key;
    if (isObject(value)) {
      violations.push(...collectStrictStyleViolations(value, path));
      return;
    }
    if (!isStrictStylePathAllowed(path)) {
      violations.push({ path, message: getStrictStyleBlockReason(path) });
    }
  });
  return violations;
}

export { STRICT_STYLE_ALLOWLIST, STRICT_BLOCK_REASON };
