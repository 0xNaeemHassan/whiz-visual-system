const HANDLE_PATTERN = /(^|[\s(])@([a-zA-Z0-9_]{2,32})/g;
const URL_TOKEN_PATTERN = /([?&](?:token|auth|apikey|api_key|access_token|signature|sig|session|jwt)=[^&#\s]*)/gi;
const NUMERIC_SEQUENCE_PATTERN = /\b\d{5,}\b/g;

export function maskUsernameHandles(input = '') {
  return String(input).replace(HANDLE_PATTERN, (_, prefix, handle) => `${prefix}@${handle.slice(0, 2)}${'•'.repeat(Math.max(2, handle.length - 2))}`);
}

export function stripUrlTokens(input = '') {
  return String(input).replace(URL_TOKEN_PATTERN, (match, token) => match.replace(token, ''));
}

export function obfuscateSensitiveNumeric(input = '') {
  return String(input).replace(NUMERIC_SEQUENCE_PATTERN, (digits) => `${digits.slice(0, 2)}${'•'.repeat(Math.max(2, digits.length - 4))}${digits.slice(-2)}`);
}

const REDACTION_PRESETS = Object.freeze({
  off: { maskHandles: false, stripUrlTokens: false, obfuscateNumeric: false },
  previewSafe: { maskHandles: true, stripUrlTokens: true, obfuscateNumeric: false },
  strict: { maskHandles: true, stripUrlTokens: true, obfuscateNumeric: true },
});

function redactString(value, options) {
  let next = value;
  if (options.maskHandles) next = maskUsernameHandles(next);
  if (options.stripUrlTokens) next = stripUrlTokens(next);
  if (options.obfuscateNumeric) next = obfuscateSensitiveNumeric(next);
  return next;
}

export function applyRedactionPreset(content = {}, presetId = 'off') {
  const preset = REDACTION_PRESETS[presetId] || REDACTION_PRESETS.off;
  const walk = (value) => {
    if (typeof value === 'string') return redactString(value, preset);
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, walk(nested)]));
    }
    return value;
  };
  return walk(content);
}

export function getRedactionPresetConfig(presetId = 'off') {
  return REDACTION_PRESETS[presetId] || REDACTION_PRESETS.off;
}
