import { useRef } from 'react';
import { useI18n } from '../i18n';
import { prefersReducedMotion } from '../motion';
import styles from './SearchBar.module.css';

export function SearchBar({ value, onChange, onSubmit, pending, placeholder }) {
  const { t } = useI18n();
  const inputRef = useRef(null);
  const formRef = useRef(null);
  const aligned = useRef(false);

  /**
   * When the user starts typing, bring the field to the top of the screen
   * (just under the sticky header) so the results below are visible.
   * Runs once per focus, so it never fights with the user's own scrolling.
   */
  const alignToTop = () => {
    if (aligned.current || !formRef.current) return;
    aligned.current = true;
    const header = document.querySelector('header');
    const offset = (header ? header.getBoundingClientRect().bottom : 0) + 12;
    const delta = formRef.current.getBoundingClientRect().top - offset;
    if (Math.abs(delta) < 8) return;
    window.scrollTo({ top: window.scrollY + delta, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  const clear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <form
      ref={formRef}
      className={styles.search}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(value);
      }}
    >
      <label htmlFor="site-search" className="visually-hidden">
        {t('search.label')}
      </label>
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="M15.5 15.5 20 20" />
      </svg>
      <input
        ref={inputRef}
        id="site-search"
        type="search"
        value={value}
        placeholder={placeholder ?? t('search.placeholder')}
        autoComplete="off"
        spellCheck="false"
        onChange={(e) => {
          if (e.target.value.trim()) alignToTop();
          onChange(e.target.value);
        }}
        onBlur={() => {
          aligned.current = false;
        }}
        onKeyDown={(e) => e.key === 'Escape' && value && clear()}
      />
      {pending && <span className={styles.spinner} aria-label={t('search.pending')} />}
      {value && (
        <button type="button" className={styles.clear} onClick={clear}>
          {t('search.clear')}
        </button>
      )}
      {onSubmit && (
        <button type="submit" className={styles.submit}>
          {t('search.submit')}
        </button>
      )}
    </form>
  );
}
