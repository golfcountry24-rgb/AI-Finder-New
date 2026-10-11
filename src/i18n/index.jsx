import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './en';
import uk from './uk';

/**
 * Tiny i18n layer: dictionaries + Intl formatting. No external library.
 * Languages: English (en) and Ukrainian (uk, shown as "UA").
 * The choice is remembered per browser and sets <html lang>.
 */
export const LANGUAGES = [
  { id: 'uk', short: 'UA', locale: 'uk-UA', name: 'Українська' },
  { id: 'en', short: 'EN', locale: 'en-GB', name: 'English' },
];

const DICTS = { en, uk };
const STORAGE_KEY = 'ai-finder-lang';

function detectLanguage() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && DICTS[saved]) return saved;
  } catch {
    /* storage unavailable — fall through */
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language || '' : '';
  return nav.toLowerCase().startsWith('uk') ? 'uk' : 'en';
}

/** Reads "a.b.c" from a nested dictionary. */
function lookup(dict, key) {
  return key.split('.').reduce((node, part) => (node == null ? node : node[part]), dict);
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectLanguage);
  const meta = LANGUAGES.find((l) => l.id === lang) ?? LANGUAGES[1];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next) => {
    if (!DICTS[next]) return;
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => {
    const dict = DICTS[lang];
    const plural = new Intl.PluralRules(lang);
    const numberFmt = new Intl.NumberFormat(meta.locale);
    // API dates are calendar days ("2026-08-13" = UTC midnight). Formatting them in the
    // visitor's time zone would show the previous day west of UTC, so they are read in UTC.
    const dateFmt = new Intl.DateTimeFormat(meta.locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    const relFmt = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });

    /** t('key', { n: 3 }) — falls back to English, then to the key itself. */
    const t = (key, vars) => {
      let text = lookup(dict, key) ?? lookup(en, key) ?? key;
      if (text && typeof text === 'object' && 'one' in text) {
        // plural forms: { one, few, many, other }
        const n = vars?.count ?? 0;
        text = text[plural.select(n)] ?? text.other;
      }
      if (typeof text !== 'string') return key;
      return vars ? text.replace(/\{(\w+)\}/g, (_, name) => (name in vars ? vars[name] : `{${name}}`)) : text;
    };

    const formatNumber = (n) => (typeof n === 'number' ? numberFmt.format(n) : '—');

    const formatDate = (value) => {
      if (!value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : dateFmt.format(date);
    };

    /** "yesterday", "24 days ago", "2 months ago" — localised by Intl. */
    const formatRelative = (value) => {
      if (!value) return null;
      const diff = Date.now() - new Date(value).getTime();
      if (Number.isNaN(diff)) return null;
      const days = Math.max(0, Math.floor(diff / 86_400_000));
      if (days < 30) return relFmt.format(-days, 'day');
      const months = Math.floor(days / 30);
      if (months < 12) return relFmt.format(-months, 'month');
      return relFmt.format(-Math.floor(months / 12), 'year');
    };

    /** Translates a raw API category value when a translation exists. */
    const category = (raw) => dict.categories?.[raw] ?? raw;

    return { lang, setLang, locale: meta.locale, t, formatNumber, formatDate, formatRelative, category };
  }, [lang, meta.locale, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
