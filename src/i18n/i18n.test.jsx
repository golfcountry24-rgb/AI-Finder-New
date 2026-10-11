// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { I18nProvider, useI18n } from './index';

const wrapper = ({ children }) => <I18nProvider>{children}</I18nProvider>;

describe('i18n', () => {
  it('shows API calendar dates on the same day in every time zone', () => {
    // west of UTC, "2026-08-13" (UTC midnight) used to be shown as 12 Aug
    process.env.TZ = 'America/Los_Angeles';
    const { result } = renderHook(() => useI18n(), { wrapper });
    result.current.setLang?.('en');
    expect(result.current.formatDate('2026-08-13')).toMatch(/13/);
    expect(result.current.formatDate('bad')).toBeNull();
    process.env.TZ = 'UTC';
  });

  it('uses Ukrainian plural forms', () => {
    localStorage.setItem('ai-finder-lang', 'uk');
    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current.t('explore.sitesWord', { count: 1 })).toBe('сайт');
    expect(result.current.t('explore.sitesWord', { count: 3 })).toBe('сайти');
    expect(result.current.t('explore.sitesWord', { count: 5 })).toBe('сайтів');
    localStorage.clear();
  });

  it('falls back to English, then to the key', () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current.t('does.not.exist')).toBe('does.not.exist');
    expect(result.current.t('states.shown', { shown: 2, total: 9 })).toMatch(/2.*9/);
  });
});
