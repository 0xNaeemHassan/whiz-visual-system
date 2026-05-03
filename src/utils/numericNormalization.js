import { formatLocaleNumber } from '../i18n/formatters.js';

const SCALE_MAP = Object.freeze({ K: 1_000, M: 1_000_000, B: 1_000_000_000 });
const UNIT_KIND = Object.freeze({ NUMBER: 'number', PERCENT: 'percent', CURRENCY: 'currency', BASIS_POINTS: 'basis_points' });
const DISPLAY_HINT = Object.freeze({ RAW: 'raw', PERCENT: 'percent', COMPACT_MILLIONS: 'compact_millions', COMPACT_BILLIONS: 'compact_billions', CURRENCY: 'currency' });
const CURRENCY_SYMBOL_MAP = Object.freeze({ '$': 'USD', '€': 'EUR', '£': 'GBP' });

export const NUMERIC_NORMALIZATION_CONTRACT = Object.freeze({
  canonicalUnits: Object.freeze({
    percent: 'decimal',
    currency: 'iso_code',
    basisPoints: 'bps',
    compactScales: Object.freeze({ million: 1_000_000, billion: 1_000_000_000 }),
  }),
});

const defaultFieldRules = Object.freeze({
  bigNumber: Object.freeze({ allowedKinds: [UNIT_KIND.NUMBER, UNIT_KIND.PERCENT, UNIT_KIND.CURRENCY, UNIT_KIND.BASIS_POINTS] }),
  bigValue: Object.freeze({ allowedKinds: [UNIT_KIND.NUMBER, UNIT_KIND.PERCENT, UNIT_KIND.CURRENCY, UNIT_KIND.BASIS_POINTS] }),
  targetMetric: Object.freeze({ allowedKinds: [UNIT_KIND.NUMBER, UNIT_KIND.PERCENT, UNIT_KIND.CURRENCY, UNIT_KIND.BASIS_POINTS] }),
  'stats[].value': Object.freeze({ allowedKinds: [UNIT_KIND.NUMBER, UNIT_KIND.PERCENT, UNIT_KIND.CURRENCY, UNIT_KIND.BASIS_POINTS] }),
  'tableRows[]': Object.freeze({ allowedKinds: [UNIT_KIND.NUMBER, UNIT_KIND.PERCENT, UNIT_KIND.CURRENCY, UNIT_KIND.BASIS_POINTS] }),
});

function parseNumericInput(rawValue = '') {
  const raw = String(rawValue ?? '');
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const compact = trimmed.replace(/\s+/g, '');
  const currencySymbol = compact.match(/^([$€£])/u)?.[1] || null;
  const withoutPrefix = compact.replace(/^[$€£]/u, '');
  const hasPercent = /%$/u.test(withoutPrefix);
  const withoutPercent = withoutPrefix.replace(/%$/u, '');
  const isBasisPoints = /bps$/iu.test(withoutPercent);
  const withoutBps = withoutPercent.replace(/bps$/iu, '');
  const abbrMatch = withoutBps.match(/([kmb])$/iu);
  const scaleToken = abbrMatch ? abbrMatch[1].toUpperCase() : null;
  let numericToken = withoutBps.replace(/([kmb])$/iu, '');

  const hasComma = numericToken.includes(',');
  const hasDot = numericToken.includes('.');
  if (hasComma && hasDot) numericToken = numericToken.replace(/,/g, '');
  else if (hasComma && !hasDot) {
    const parts = numericToken.split(',');
    const looksDecimal = parts.at(-1)?.length !== 3;
    numericToken = looksDecimal ? numericToken.replace(',', '.') : numericToken.replace(/,/g, '');
  }

  const parsedNumber = Number(numericToken);
  if (!Number.isFinite(parsedNumber)) return null;

  const scaled = scaleToken ? parsedNumber * SCALE_MAP[scaleToken] : parsedNumber;
  let kind = UNIT_KIND.NUMBER;
  let canonicalValue = scaled;
  if (hasPercent) {
    kind = UNIT_KIND.PERCENT;
    canonicalValue = scaled / 100;
  }
  if (isBasisPoints) {
    kind = UNIT_KIND.BASIS_POINTS;
    canonicalValue = scaled;
  }
  if (currencySymbol) kind = UNIT_KIND.CURRENCY;

  const currencyCode = currencySymbol ? CURRENCY_SYMBOL_MAP[currencySymbol] : null;
  return { raw, kind, canonicalValue, currencyCode, scaleToken, hasPercent, isBasisPoints };
}

function formatDisplay(parsed, locale = 'en-US') {
  if (!parsed) return null;
  const { canonicalValue, kind, currencyCode } = parsed;
  if (kind === UNIT_KIND.PERCENT) {
    return `${formatLocaleNumber(canonicalValue * 100, { locale, minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
  }
  if (kind === UNIT_KIND.CURRENCY) {
    const formatted = formatLocaleNumber(canonicalValue, { locale, minimumFractionDigits: 0, maximumFractionDigits: Number.isInteger(canonicalValue) ? 0 : 2 });
    return `${currencyCode || 'USD'} ${formatted}`;
  }
  if (kind === UNIT_KIND.BASIS_POINTS) {
    return `${formatLocaleNumber(canonicalValue, { locale, minimumFractionDigits: 0, maximumFractionDigits: 2 })} bps`;
  }
  return formatLocaleNumber(canonicalValue, { locale, minimumFractionDigits: 0, maximumFractionDigits: Number.isInteger(canonicalValue) ? 0 : 2 });
}

function buildMeta(parsed, fieldPath, rule = null) {
  if (!parsed) return null;
  const incompatible = Array.isArray(rule?.allowedKinds) && !rule.allowedKinds.includes(parsed.kind);
  return {
    fieldPath,
    kind: parsed.kind,
    canonicalValue: parsed.canonicalValue,
    canonicalUnit: parsed.kind === UNIT_KIND.PERCENT ? 'decimal' : parsed.kind === UNIT_KIND.CURRENCY ? (parsed.currencyCode || 'USD') : parsed.kind === UNIT_KIND.BASIS_POINTS ? 'bps' : 'number',
    displayUnit: parsed.kind === UNIT_KIND.PERCENT ? '%' : parsed.kind === UNIT_KIND.CURRENCY ? (parsed.currencyCode || 'USD') : parsed.kind === UNIT_KIND.BASIS_POINTS ? 'bps' : (parsed.scaleToken || 'raw'),
    currencyCode: parsed.currencyCode,
    displayHint: parsed.kind === UNIT_KIND.PERCENT ? DISPLAY_HINT.PERCENT : (parsed.scaleToken === 'M' ? DISPLAY_HINT.COMPACT_MILLIONS : parsed.scaleToken === 'B' ? DISPLAY_HINT.COMPACT_BILLIONS : parsed.kind === UNIT_KIND.CURRENCY ? DISPLAY_HINT.CURRENCY : DISPLAY_HINT.RAW),
    incompatible,
  };
}

export function normalizeNumericFields(content = {}, { locale = 'en-US', fieldRules = defaultFieldRules } = {}) {
  const normalizedContent = { ...content };
  const corrections = [];
  const unitMetadata = { ...(content.unitMetadata || {}) };
  const fields = ['bigNumber', 'bigValue', 'targetMetric'];

  fields.forEach((field) => {
    if (typeof content[field] !== 'string') return;
    const parsed = parseNumericInput(content[field]);
    if (!parsed) return;
    const displayValue = formatDisplay(parsed, locale);
    const meta = buildMeta(parsed, field, fieldRules[field]);
    unitMetadata[field] = meta;
    if (displayValue !== content[field]) {
      normalizedContent[field] = displayValue;
      corrections.push({ path: field, before: content[field], after: displayValue, reason: `Normalized numeric format (${content[field]} → ${displayValue})` });
    }
  });

  if (Array.isArray(content.stats)) {
    const statsUnitMetadata = [];
    normalizedContent.stats = content.stats.map((stat = {}, index) => {
      if (typeof stat?.value !== 'string') return stat;
      const parsed = parseNumericInput(stat.value);
      if (!parsed) return stat;
      const displayValue = formatDisplay(parsed, locale);
      statsUnitMetadata[index] = buildMeta(parsed, `stats[${index}].value`, fieldRules['stats[].value']);
      if (displayValue !== stat.value) corrections.push({ path: `stats[${index}].value`, before: stat.value, after: displayValue, reason: `Normalized numeric format (${stat.value} → ${displayValue})` });
      return { ...stat, value: displayValue };
    });
    unitMetadata.stats = statsUnitMetadata;
  }

  if (Array.isArray(content.tableRows)) {
    const tableUnitMetadata = [];
    normalizedContent.tableRows = content.tableRows.map((row = {}, rowIndex) => {
      const next = { ...row };
      const rowMeta = {};
      Object.entries(row).forEach(([key, val]) => {
        if (key === 'provenance' || typeof val !== 'string') return;
        const parsed = parseNumericInput(val);
        if (!parsed) return;
        const displayValue = formatDisplay(parsed, locale);
        rowMeta[key] = buildMeta(parsed, `tableRows[${rowIndex}].${key}`, fieldRules['tableRows[]']);
        if (displayValue !== val) corrections.push({ path: `tableRows[${rowIndex}].${key}`, before: val, after: displayValue, reason: `Normalized numeric format (${val} → ${displayValue})` });
        next[key] = displayValue;
      });
      tableUnitMetadata[rowIndex] = rowMeta;
      return next;
    });
    unitMetadata.tableRows = tableUnitMetadata;
  }

  normalizedContent.unitMetadata = unitMetadata;
  return {
    content: normalizedContent,
    corrections,
    hasCorrections: corrections.length > 0,
    unitMetadata,
    contract: NUMERIC_NORMALIZATION_CONTRACT,
    compatibility: buildCompatibilityReport(unitMetadata),
  };
}

function collectMetaEntries(unitMetadata = {}) {
  const entries = [];
  ['bigNumber', 'bigValue', 'targetMetric'].forEach((key) => {
    if (unitMetadata[key]?.kind) entries.push(unitMetadata[key]);
  });
  (unitMetadata.stats || []).forEach((meta) => { if (meta?.kind) entries.push(meta); });
  (unitMetadata.tableRows || []).forEach((rowMeta = {}) => {
    Object.values(rowMeta).forEach((meta) => { if (meta?.kind) entries.push(meta); });
  });
  return entries;
}

function buildCompatibilityReport(unitMetadata = {}) {
  const entries = collectMetaEntries(unitMetadata);
  const byKind = entries.reduce((acc, meta) => {
    const key = meta.kind === UNIT_KIND.CURRENCY ? `${meta.kind}:${meta.canonicalUnit}` : meta.kind;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const kinds = Object.keys(byKind);
  return {
    hasMixedKinds: kinds.length > 1,
    kinds,
    blockedArithmetic: kinds.length > 1,
    blockedComparisons: kinds.length > 1,
  };
}
