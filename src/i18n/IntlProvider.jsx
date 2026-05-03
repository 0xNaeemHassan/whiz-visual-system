import { createContext, useContext, useMemo, useState } from 'react';
import { DEFAULT_LOCALE, LOCALE_METADATA, MESSAGE_CATALOGS } from './catalogs.js';

const IntlContext = createContext(null);

function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

function interpolate(template, params = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => (params[key] ?? `{${key}}`));
}

export function IntlProvider({ children, initialLocale = DEFAULT_LOCALE }) {
  const [locale, setLocale] = useState(LOCALE_METADATA[initialLocale] ? initialLocale : DEFAULT_LOCALE);
  const messages = MESSAGE_CATALOGS[locale] || MESSAGE_CATALOGS[DEFAULT_LOCALE];

  const value = useMemo(() => ({
    locale,
    locales: Object.values(LOCALE_METADATA),
    setLocale,
    t: (path, params = {}) => {
      const fallback = getByPath(MESSAGE_CATALOGS[DEFAULT_LOCALE], path) || path;
      const resolved = getByPath(messages, path) || fallback;
      return interpolate(resolved, params);
    },
  }), [locale, messages]);

  return <IntlContext.Provider value={value}>{children}</IntlContext.Provider>;
}

export function useIntl() {
  const context = useContext(IntlContext);
  if (!context) throw new Error('useIntl must be used within IntlProvider');
  return context;
}
