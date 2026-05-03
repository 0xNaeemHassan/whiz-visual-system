import { DEFAULT_LOCALE } from './catalogs.js';

export function formatLocaleDate({ year, month, day, locale = DEFAULT_LOCALE, options = {} }) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...options }).format(date);
}

export function formatLocaleNumber(value, { locale = DEFAULT_LOCALE, minimumFractionDigits = 0, maximumFractionDigits = 2 } = {}) {
  return new Intl.NumberFormat(locale, { minimumFractionDigits, maximumFractionDigits }).format(value);
}
