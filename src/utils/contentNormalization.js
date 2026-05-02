const FORBIDDEN_RE = /[^A-Za-z0-9\s_-]/g;
const MULTISPACE_RE = /\s+/g;

export function normalizeTopicTag(value = '') {
  const raw = String(value ?? '');
  const stripped = raw.replace(FORBIDDEN_RE, ' ').replace(MULTISPACE_RE, ' ').trim();
  const words = stripped.split(' ').filter(Boolean).slice(0, 4);
  const normalized = words.join(' ').toUpperCase();

  const messages = [];
  if (raw !== normalized) {
    messages.push('Topic tag auto-corrected to uppercase alphanumeric format (max 4 words).');
  }

  let invalidReason = '';
  if (!normalized) invalidReason = 'Topic tag cannot be empty after normalization.';
  else if (!/^[A-Z0-9]+(?: [A-Z0-9]+){0,3}$/.test(normalized)) invalidReason = 'Topic tag must be 1-4 uppercase alphanumeric words.';

  return {
    raw,
    normalized,
    changed: raw !== normalized,
    valid: !invalidReason,
    invalidReason,
    messages,
  };
}

export function normalizeSlug(value = '', { prefix = '', separator = '-' } = {}) {
  const raw = String(value ?? '');
  const cleanSeparator = separator || '-';
  const base = raw
    .replace(FORBIDDEN_RE, ' ')
    .toLowerCase()
    .trim()
    .replace(MULTISPACE_RE, cleanSeparator)
    .replace(/[-_]+/g, cleanSeparator)
    .replace(new RegExp(`${cleanSeparator}{2,}`, 'g'), cleanSeparator)
    .replace(new RegExp(`^${cleanSeparator}+|${cleanSeparator}+$`, 'g'), '');

  const normalized = prefix ? `${prefix}${base ? cleanSeparator : ''}${base}` : base;
  const messages = [];
  if (raw !== normalized) {
    messages.push(`Slug auto-corrected to lowercase ${cleanSeparator === '-' ? 'kebab-case' : 'separated'} format.`);
  }

  let invalidReason = '';
  if (!normalized) invalidReason = 'Slug cannot be empty after normalization.';
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) invalidReason = 'Slug must be lowercase kebab-case alphanumeric.';
  else if (normalized.length < 3 || normalized.length > 36) invalidReason = 'Slug must be between 3 and 36 characters.';

  return { raw, normalized, changed: raw !== normalized, valid: !invalidReason, invalidReason, messages };
}

export function normalizeContentTaxonomy(content = {}) {
  const topic = normalizeTopicTag(content.topicTag || '');
  const slug = normalizeSlug(topic.normalized, { prefix: 'whiz' });
  const normalizedContent = { ...content, topicTag: topic.normalized, slug: slug.normalized };

  return {
    content: normalizedContent,
    compliance: {
      autoCorrected: [...topic.messages, ...slug.messages],
      invalid: [topic.invalidReason, slug.invalidReason].filter(Boolean),
      hasInvalid: !topic.valid || !slug.valid,
    },
  };
}
