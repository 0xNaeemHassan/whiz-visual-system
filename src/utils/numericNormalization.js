const ABBREV_MULTIPLIERS = Object.freeze({ K: 1_000, M: 1_000_000, B: 1_000_000_000 });

function normalizeNumericString(value = '') {
  const raw = String(value ?? '');
  const trimmed = raw.trim();
  if (!trimmed) return { value: raw, normalized: raw, changed: false, reason: null };

  const compact = trimmed.replace(/\s+/g, '');
  const percent = compact.endsWith('%');
  const unitPrefixMatch = compact.match(/^([$€£])/);
  const unitPrefix = unitPrefixMatch ? unitPrefixMatch[1] : '';
  const body = compact.replace(/^[$€£]/, '').replace(/%$/, '');
  const match = body.match(/^(-?[\d.,]+)([kmbKMB])?$/);
  if (!match) return { value: raw, normalized: raw, changed: false, reason: null };

  let numericToken = match[1];
  const abbr = (match[2] || '').toUpperCase();
  const hasComma = numericToken.includes(',');
  const hasDot = numericToken.includes('.');

  if (hasComma && hasDot) {
    numericToken = numericToken.replace(/,/g, '');
  } else if (hasComma && !hasDot) {
    const commaParts = numericToken.split(',');
    const looksDecimal = commaParts.at(-1)?.length !== 3;
    numericToken = looksDecimal ? numericToken.replace(',', '.') : numericToken.replace(/,/g, '');
  }

  const numericValue = Number(numericToken);
  if (!Number.isFinite(numericValue)) return { value: raw, normalized: raw, changed: false, reason: null };

  const scaled = abbr ? numericValue * ABBREV_MULTIPLIERS[abbr] : numericValue;
  const precision = percent ? 2 : (Number.isInteger(scaled) ? 0 : 2);
  const formatted = scaled.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: precision });
  const normalized = `${unitPrefix}${formatted}${percent ? '%' : ''}`;

  return {
    value: raw,
    normalized,
    changed: normalized !== raw,
    reason: normalized !== raw ? `Normalized numeric format (${raw} → ${normalized})` : null,
  };
}

function normalizeTableRows(rows = []) {
  if (!Array.isArray(rows)) return { value: rows, normalized: rows, corrections: [] };
  const corrections = [];
  const normalized = rows.map((row, rowIndex) => {
    if (!row || typeof row !== 'object') return row;
    const next = { ...row };
    Object.entries(row).forEach(([key, val]) => {
      if (typeof val !== 'string') return;
      const result = normalizeNumericString(val);
      if (result.changed) {
        next[key] = result.normalized;
        corrections.push({ path: `tableRows[${rowIndex}].${key}`, before: val, after: result.normalized, reason: result.reason });
      }
    });
    return next;
  });
  return { value: rows, normalized, corrections };
}

export function normalizeNumericFields(content = {}) {
  const fields = ['bigNumber', 'bigValue', 'targetMetric'];
  const normalizedContent = { ...content };
  const corrections = [];

  fields.forEach((field) => {
    if (typeof content[field] !== 'string') return;
    const result = normalizeNumericString(content[field]);
    if (result.changed) {
      normalizedContent[field] = result.normalized;
      corrections.push({ path: field, before: content[field], after: result.normalized, reason: result.reason });
    }
  });

  if (Array.isArray(content.stats)) {
    normalizedContent.stats = content.stats.map((stat = {}, index) => {
      if (typeof stat?.value !== 'string') return stat;
      const result = normalizeNumericString(stat.value);
      if (!result.changed) return stat;
      corrections.push({ path: `stats[${index}].value`, before: stat.value, after: result.normalized, reason: result.reason });
      return { ...stat, value: result.normalized };
    });
  }

  const tableResult = normalizeTableRows(content.tableRows || []);
  normalizedContent.tableRows = tableResult.normalized;
  corrections.push(...tableResult.corrections);

  return {
    content: normalizedContent,
    corrections,
    hasCorrections: corrections.length > 0,
  };
}
