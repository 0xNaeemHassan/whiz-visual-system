const CTA_SIGNALS = Object.freeze([
  { token: 'buy', canonical: 'buy' },
  { token: 'long', canonical: 'buy' },
  { token: 'accumulate', canonical: 'buy' },
  { token: 'add', canonical: 'buy' },
  { token: 'sell', canonical: 'sell' },
  { token: 'short', canonical: 'sell' },
  { token: 'exit', canonical: 'sell' },
  { token: 'avoid', canonical: 'avoid' },
  { token: 'wait', canonical: 'wait' },
  { token: 'hold', canonical: 'hold' },
]);

function splitSentences(text = '') {
  return String(text)
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function detectCallToActions(content = {}) {
  const fields = [content.verdict, content.deck, content.body]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const matches = CTA_SIGNALS
    .filter(({ token }) => fields.includes(token))
    .map(({ canonical }) => canonical);

  return [...new Set(matches)];
}

export function validateNarrativeIntent(content = {}) {
  const warnings = [];
  const errors = [];

  const titleSentences = splitSentences(content.title);
  const questionMarks = (content.title || '').match(/\?/g) || [];
  const thesisCount = titleSentences.length + questionMarks.length;

  if (thesisCount !== 1) {
    errors.push('Narrative intent: provide exactly one primary thesis/question in the title.');
  }

  const deck = String(content.deck || '').toLowerCase();
  const body = String(content.body || '').toLowerCase();
  const deckTokens = deck.match(/[a-z0-9]{4,}/g) || [];
  const sharedTokens = deckTokens.filter((token) => body.includes(token));
  const alignmentRatio = deckTokens.length ? sharedTokens.length / deckTokens.length : 1;

  if (deckTokens.length > 0 && alignmentRatio < 0.25) {
    warnings.push('Narrative intent: deck appears weakly aligned with body copy.');
  }

  const ctas = detectCallToActions(content);
  const conflictingCtaSet = ['buy', 'sell', 'avoid'];
  const conflicting = ctas.filter((cta) => conflictingCtaSet.includes(cta));
  if (new Set(conflicting).size > 1) {
    errors.push(`Narrative intent: conflicting calls-to-action detected (${[...new Set(conflicting)].join(' vs ')}).`);
  }

  return { warnings, errors };
}
