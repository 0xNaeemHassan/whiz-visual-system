const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DATE_INPUT_FORMATS = Object.freeze([
  'YYYY-MM-DD',
  'YYYY/MM/DD',
  'YYYY.MM.DD',
  'YYYYMMDD',
  'MM.DD.YY',
  'MM/DD/YY',
  'MM-DD-YY',
  'MM.DD.YYYY',
  'MM/DD/YYYY',
  'MM-DD-YYYY',
  'Mon DD, YYYY',
]);

function toInt(v) {
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
}

function expandYear(year) {
  if (year >= 100) return year;
  return year >= 70 ? 1900 + year : 2000 + year;
}

function buildDateParts(year, month, day) {
  if (![year, month, day].every((n) => Number.isInteger(n))) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  const isoDate = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  const displayDate = `${month.toString().padStart(2, '0')}.${day.toString().padStart(2, '0')}.${(year % 100).toString().padStart(2, '0')}`;
  return { year, month, day, isoDate, displayDate };
}

function parseMonthName(value) {
  const rx = /^([A-Za-z]{3,9})\s+(\d{1,2}),\s*(\d{4})$/;
  const m = String(value).trim().match(rx);
  if (!m) return null;
  const monthIdx = MONTH_NAMES.findIndex((short) => short.toLowerCase() === m[1].slice(0, 3).toLowerCase());
  if (monthIdx < 0) return null;
  return buildDateParts(toInt(m[3]), monthIdx + 1, toInt(m[2]));
}

function parseNumericWithDelimiter(value, delimiter) {
  const parts = String(value).split(delimiter).map((p) => p.trim());
  if (parts.length !== 3) return null;

  if (parts[0].length === 4) {
    return buildDateParts(toInt(parts[0]), toInt(parts[1]), toInt(parts[2]));
  }

  if (parts[2].length === 4) {
    return buildDateParts(toInt(parts[2]), toInt(parts[0]), toInt(parts[1]));
  }

  if (parts[2].length === 2) {
    return buildDateParts(expandYear(toInt(parts[2])), toInt(parts[0]), toInt(parts[1]));
  }

  return null;
}

function parseCompactIso(value) {
  const m = String(value).trim().match(/^(\d{4})(\d{2})(\d{2})$/);
  if (!m) return null;
  return buildDateParts(toInt(m[1]), toInt(m[2]), toInt(m[3]));
}

function parseDateInput(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value) return null;
  return parseCompactIso(value)
    || parseNumericWithDelimiter(value, '-')
    || parseNumericWithDelimiter(value, '/')
    || parseNumericWithDelimiter(value, '.')
    || parseMonthName(value);
}

export function normalizeDateInput(rawValue) {
  const parsed = parseDateInput(rawValue);
  if (!parsed) {
    return {
      valid: false,
      reason: 'Date is invalid or uses an unsupported format.',
      suggestions: [`Use one of: ${DATE_INPUT_FORMATS.join(', ')}`],
    };
  }
  return { valid: true, ...parsed };
}

export function normalizeTimelineEvents(events = []) {
  return Array.isArray(events)
    ? events.map((event) => {
      const normalizedDate = normalizeDateInput(event?.date);
      return {
        date: normalizedDate.valid ? normalizedDate.displayDate : String(event?.date || ''),
        isoDate: normalizedDate.valid ? normalizedDate.isoDate : '',
        label: String(event?.label || ''),
        sub: String(event?.sub || ''),
      };
    })
    : [];
}

export function getDateFormatGuidance() {
  return { acceptedInputFormats: DATE_INPUT_FORMATS, canonicalOutput: { isoDate: 'YYYY-MM-DD', displayDate: 'MM.DD.YY' } };
}
