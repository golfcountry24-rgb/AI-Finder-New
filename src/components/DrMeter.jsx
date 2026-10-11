import { useI18n } from '../i18n';
import styles from './DrMeter.module.css';

const SEGMENTS = 10;

/** Domain Rating (0–100) as a compact segmented meter. Missing value → "n/a". */
export function DrMeter({ value, compact = false }) {
  const { t } = useI18n();
  const hasValue = typeof value === 'number';
  const filled = hasValue ? Math.round((value / 100) * SEGMENTS) : 0;

  return (
    <span
      className={`${styles.meter} ${compact ? styles.compact : ''}`}
      title={hasValue ? t('card.drTitle', { value }) : t('card.drMissing')}
    >
      <span className={styles.label}>{t('card.dr')}</span>
      <span className={styles.value}>{hasValue ? value : t('card.na')}</span>
      {!compact && (
        <span className={styles.bar} aria-hidden="true">
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <span key={i} className={i < filled ? styles.on : undefined} />
          ))}
        </span>
      )}
    </span>
  );
}
