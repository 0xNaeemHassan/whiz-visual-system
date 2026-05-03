import { CANONICAL_PROTOCOL_TAGS, PROTOCOL_TAG_ALIAS_MAP } from '../data/protocolTagTaxonomy';

const TOKEN_RE = /[a-z0-9][a-z0-9-]*/gi;

function tokenize(text = '') {
  return String(text || '').toLowerCase().match(TOKEN_RE) || [];
}

export function extractProtocolTagSuggestions({ title = '', body = '', tableRows = [] } = {}) {
  const weightedTokens = [
    ...tokenize(title).map((token) => ({ token, weight: 3, source: 'title' })),
    ...tokenize(body).map((token) => ({ token, weight: 1, source: 'body' })),
    ...tableRows.flatMap((row) => tokenize(Object.values(row || {}).join(' ')).map((token) => ({ token, weight: 2, source: 'table' }))),
  ];

  const canonicalScores = new Map();
  const seenAliases = new Map();
  weightedTokens.forEach(({ token, weight, source }) => {
    const canonical = PROTOCOL_TAG_ALIAS_MAP[token];
    if (!canonical) return;
    canonicalScores.set(canonical, (canonicalScores.get(canonical) || 0) + weight);
    if (!seenAliases.has(canonical)) seenAliases.set(canonical, new Set());
    seenAliases.get(canonical).add(`${source}:${token}`);
  });

  const ranked = [...canonicalScores.entries()]
    .map(([canonical, score]) => ({ canonical, score, aliases: [...(seenAliases.get(canonical) || [])] }))
    .sort((a, b) => b.score - a.score || a.canonical.localeCompare(b.canonical));

  const topScore = ranked[0]?.score || 1;
  return ranked.map((entry) => ({
    tag: entry.canonical,
    confidence: Math.max(0.1, Math.min(1, entry.score / topScore)),
    ambiguous: ranked.filter((i) => i.score === entry.score).length > 1,
    evidence: entry.aliases,
  }));
}

export function normalizeProtocolTags(tags = []) {
  const normalized = [];
  const unknown = [];
  const seen = new Set();
  tags.forEach((raw) => {
    const token = String(raw || '').trim().toLowerCase();
    if (!token) return;
    const canonical = PROTOCOL_TAG_ALIAS_MAP[token] || (CANONICAL_PROTOCOL_TAGS.includes(String(raw).trim().toUpperCase()) ? String(raw).trim().toUpperCase() : null);
    if (!canonical) {
      unknown.push(raw);
      return;
    }
    if (!seen.has(canonical)) {
      seen.add(canonical);
      normalized.push(canonical);
    }
  });
  return { tags: normalized, unknown };
}
