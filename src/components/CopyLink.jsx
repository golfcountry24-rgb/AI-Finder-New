import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import styles from './CopyLink.module.css';

/** Copies the current page address; the label says "Copied" for a moment. */
export function CopyLink({ className = '' }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt(t('sitePage.copyPrompt'), window.location.href);
    }
  };

  return (
    <button type="button" className={`btn btn--ghost ${styles.copy} ${className}`} onClick={copy}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {copied ? (
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        ) : (
          <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
        )}
      </svg>
      <span aria-live="polite">{copied ? t('sitePage.copied') : t('sitePage.copy')}</span>
    </button>
  );
}
