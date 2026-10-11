import { useRef } from 'react';
import { useRevealUp } from '../motion/hooks';
import { useI18n } from '../i18n';
import styles from './StateViews.module.css';

/** Translated text for an ApiError (falls back to the raw message). */
function useErrorMessage(error) {
  const { t } = useI18n();
  if (!error) return t('states.errorDefault');
  if (error.code === 'network') return t('errors.network');
  if (error.code === 'timeout') return t('errors.timeout');
  if (error.code === 'status') return t('errors.status', { status: error.status });
  if (error.code === 'format') return t('errors.format');
  return error.message || t('states.errorDefault');
}

export function SkeletonGrid({ count = 6, variant = 'grid' }) {
  const { t } = useI18n();
  return (
    <div
      className={variant === 'list' ? styles.list : styles.grid}
      role="status"
      aria-live="polite"
      aria-label={t('states.loading')}
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.skeleton} style={{ animationDelay: `${i * 80}ms` }}>
          <span className={styles.line} style={{ width: '45%' }} />
          <span className={`${styles.line} ${styles.title}`} style={{ width: '70%' }} />
          <span className={styles.line} />
          <span className={styles.line} style={{ width: '85%' }} />
          <span className={styles.line} style={{ width: '30%', marginTop: 'auto' }} />
        </div>
      ))}
      <span className="visually-hidden">{t('states.loadingText')}</span>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const ref = useRef(null);
  const { t } = useI18n();
  const message = useErrorMessage(error);
  useRevealUp(ref, [], { distance: 16, step: 60 });
  return (
    <div ref={ref} className={`${styles.panel} ${styles.error}`} role="alert">
      <span className={styles.glyph} aria-hidden="true" data-reveal>
        !
      </span>
      <h3 data-reveal>{t('states.errorTitle')}</h3>
      <p data-reveal>{message}</p>
      <button type="button" className="btn" onClick={onRetry}>
        {t('states.retry')}
      </button>
    </div>
  );
}

/** `as` sets the heading level (h1 when the empty state is the whole page, e.g. 404). */
export function EmptyState({ title, children, action, as: Heading = 'h3' }) {
  const ref = useRef(null);
  useRevealUp(ref, [], { distance: 16, step: 60 });
  return (
    <div ref={ref} className={styles.panel} role="status">
      <span className={styles.glyph} aria-hidden="true" data-reveal>
        ∅
      </span>
      <Heading className={styles.title} data-reveal>
        {title}
      </Heading>
      {children && <p data-reveal>{children}</p>}
      {action}
    </div>
  );
}

export function LoadMore({ onClick, loading, error, shown, total }) {
  const { t, formatNumber } = useI18n();
  const errorMessage = useErrorMessage(error);
  return (
    <div className={styles.more}>
      <span className="mono">{t('states.shown', { shown: formatNumber(shown), total: formatNumber(total) })}</span>
      {error && <span className={styles.moreError}>{errorMessage}</span>}
      <button type="button" className="btn btn--ghost" onClick={onClick} disabled={loading} aria-busy={loading}>
        {loading ? t('states.loadingMore') : error ? t('states.tryAgain') : t('states.loadMore')}
      </button>
    </div>
  );
}
