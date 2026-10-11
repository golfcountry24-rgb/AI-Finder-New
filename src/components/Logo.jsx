import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import styles from './Logo.module.css';

export function Logo({ inverted = false, compact = false }) {
  const { t } = useI18n();
  return (
    <Link to="/" className={`${styles.logo} ${inverted ? styles.inverted : ''} ${compact ? styles.compact : ''}`} aria-label={t('common.home')}>
      <svg className={styles.mark} viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="16" className={styles.bg} />
        <g className={styles.glass}>
          <circle cx="14.5" cy="14.5" r="6" fill="none" className={styles.lens} strokeWidth="2.4" />
          <path d="M19.2 19.2l4.2 4.2" className={styles.handle} strokeWidth="2.8" strokeLinecap="round" />
        </g>
      </svg>
      <span className={styles.word}>AI Finder</span>
    </Link>
  );
}
