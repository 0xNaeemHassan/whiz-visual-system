const CITATION_ANCHOR_REGEX = /\^?\[(\d+)\]|(?:\^|<sup>)(\d+)(?:<\/sup>)?/gi;

const normalizeString = (value) => String(value || '').trim();

const SUPERSCRIPT_DIGITS = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };

function provenanceToKey(provenance = {}) {
  return [
    normalizeString(provenance.label),
    normalizeString(provenance.source),
    normalizeString(provenance.url),
    normalizeString(provenance.date),
  ].join('|');
}

function toSuperscriptNumber(number) {
  return String(number)
    .split('')
    .map((digit) => SUPERSCRIPT_DIGITS[digit] || digit)
    .join('');
}

function normalizeAnchoredText(text, validCitationNumbers, strictMode) {
  const value = normalizeString(text);
  if (!value) return { text: '', claims: [] };
  const claims = [];
  const normalizedText = value.replace(CITATION_ANCHOR_REGEX, (raw, bracketNumber, supNumber) => {
    const explicitNumber = Number(bracketNumber || supNumber);
    if (!Number.isFinite(explicitNumber) || explicitNumber <= 0) return '';
    const exists = validCitationNumbers.has(explicitNumber);
    claims.push({ anchor: raw, citationNumber: explicitNumber, resolved: exists });
    if (!exists) {
      if (strictMode) {
        throw new Error(`Citation ${explicitNumber} is referenced but no matching provenance source exists.`);
      }
      return '';
    }
    return toSuperscriptNumber(explicitNumber);
  });

  return { text: normalizedText, claims };
}

export function buildCitationModel(content = {}, citationMode = 'off', options = {}) {
  const mode = ['off', 'compact', 'full'].includes(citationMode) ? citationMode : 'off';
  const strictMode = Boolean(options?.strictMode);
  const entries = [];
  const keyToNumber = new Map();

  const addProvenance = (provenance, fallbackLabel = '') => {
    if (!provenance || typeof provenance !== 'object') return null;
    const normalized = {
      label: normalizeString(provenance.label || fallbackLabel),
      source: normalizeString(provenance.source),
      url: normalizeString(provenance.url),
      date: normalizeString(provenance.date),
    };
    const key = provenanceToKey(normalized);
    if (!key.replace(/\|/g, '')) return null;
    if (keyToNumber.has(key)) return keyToNumber.get(key);
    const number = entries.length + 1;
    keyToNumber.set(key, number);
    entries.push({ number, key, ...normalized });
    return number;
  };

  addProvenance(content?.metricProvenance, content?.targetMetric || 'Metric');
  (Array.isArray(content?.stats) ? content.stats : []).forEach((stat, index) => addProvenance(stat?.provenance, stat?.label || `Stat ${index + 1}`));
  (Array.isArray(content?.tableRows) ? content.tableRows : []).forEach((row, index) => addProvenance(row?.provenance, `Row ${index + 1}`));

  const validCitationNumbers = new Set(entries.map((entry) => entry.number));
  const title = normalizeAnchoredText(content?.title, validCitationNumbers, strictMode);
  const deck = normalizeAnchoredText(content?.deck, validCitationNumbers, strictMode);
  const body = normalizeAnchoredText(content?.body, validCitationNumbers, strictMode);

  return {
    mode,
    anchoredClaims: [...title.claims, ...deck.claims, ...body.claims],
    entries,
    boundText: {
      title: title.text,
      deck: deck.text,
      body: body.text,
    },
  };
}
