const DEFAULT_WINDOW_DAYS = 14;

const normalize = (value) => String(value || '').trim();

export function normalizeTopicTokens(content = {}) {
  const raw = [content.topicTag, content.title, content.deck, content.body].map((part) => normalize(part).toLowerCase()).join(' ');
  const cleaned = raw.replace(/[^a-z0-9\s]/g, ' ');
  return Array.from(new Set(cleaned.split(/\s+/).filter((token) => token.length >= 3)));
}

export function createFrameSignatureHash(frame = {}) {
  const frameId = Number(frame?.frameId) || 0;
  const layout = normalize(frame?.layoutId || frame?.layout || '').toLowerCase();
  const keys = Object.keys(frame?.overrides || {}).sort().join('|');
  return `${frameId}:${layout}:${keys}`;
}

const toDate = (value) => {
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

const jaccard = (a, b) => {
  const setA = new Set(a);
  const setB = new Set(b);
  if (!setA.size && !setB.size) return 1;
  let intersection = 0;
  for (const token of setA) if (setB.has(token)) intersection += 1;
  const union = new Set([...setA, ...setB]).size;
  return union ? intersection / union : 0;
};

export function detectDuplicatePublication({
  draft,
  recentPublications = [],
  now = new Date(),
  windowDays = DEFAULT_WINDOW_DAYS,
  nearDuplicateThreshold = 0.6,
} = {}) {
  const nowDate = toDate(now) || new Date();
  const windowStart = new Date(nowDate.getTime() - (windowDays * 24 * 60 * 60 * 1000));
  const draftTokens = normalizeTopicTokens(draft?.content || {});
  const draftSignature = createFrameSignatureHash(draft || {});

  let bestMatch = null;
  for (const candidate of recentPublications) {
    const publishedAt = toDate(candidate?.publishedAt);
    if (!publishedAt || publishedAt < windowStart || publishedAt > nowDate) continue;
    const similarity = jaccard(draftTokens, normalizeTopicTokens(candidate?.content || {}));
    const signatureMatch = draftSignature === createFrameSignatureHash(candidate || {});
    const isExact = signatureMatch && similarity >= 0.98;
    const isNear = signatureMatch && similarity >= nearDuplicateThreshold;
    if (!isExact && !isNear) continue;
    const severity = isExact ? 'blocking' : 'warning';
    const finding = {
      candidateId: candidate?.id || null,
      publishedAt: publishedAt.toISOString(),
      similarity: Number(similarity.toFixed(3)),
      signatureMatch,
      severity,
      reason: isExact ? 'Exact duplicate in recent publication window.' : 'Near-duplicate topic with reused frame/layout signature.',
    };
    if (!bestMatch || finding.similarity > bestMatch.similarity) bestMatch = finding;
  }

  return {
    windowDays,
    windowStart: windowStart.toISOString(),
    checkedAt: nowDate.toISOString(),
    duplicate: bestMatch,
  };
}
