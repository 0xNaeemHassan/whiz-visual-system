const CITATION_ANCHOR_REGEX = /\^?\[(\d+)\]|(?:\^|<sup>)(\d+)(?:<\/sup>)?/gi;

const normalizeString = (value) => String(value || '').trim();

function provenanceToKey(provenance = {}) {
  return [
    normalizeString(provenance.label),
    normalizeString(provenance.source),
    normalizeString(provenance.url),
    normalizeString(provenance.date),
  ].join('|');
}

export function buildCitationModel(content = {}, citationMode = 'off') {
  const mode = ['off', 'compact', 'full'].includes(citationMode) ? citationMode : 'off';
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

  const anchoredClaims = [];
  const claimText = [content?.title, content?.deck, content?.body].map(normalizeString).join(' ');
  let match;
  while ((match = CITATION_ANCHOR_REGEX.exec(claimText)) !== null) {
    const explicitNumber = Number(match[1] || match[2]);
    if (Number.isFinite(explicitNumber) && explicitNumber > 0) {
      anchoredClaims.push({ anchor: match[0], citationNumber: explicitNumber });
    }
  }

  return {
    mode,
    anchoredClaims,
    entries,
  };
}
