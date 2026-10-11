import { Link, useLocation } from 'react-router-dom';
import { Favicon } from './Favicon';
import { compareHref, useCompare } from '../store/savedSites';
import { getDisplayName } from '../utils/format';
import { useI18n } from '../i18n';
import styles from './CompareTray.module.css';

/** Floating bar with the sites picked for comparison; hidden on the comparison page itself. */
export function CompareTray() {
  const compare = useCompare();
  const { pathname } = useLocation();
  const { t } = useI18n();
  if (compare.count === 0 || pathname === '/compare') return null;
  const domains = compare.items.map((s) => s.domain);

  return (
    <aside className={styles.tray} aria-label={t('compareTray.label')}>
      <ul className={styles.sites}>
        {compare.items.map((site) => (
          <li key={site.domain} title={site.domain}>
            <Favicon domain={site.domain} size="sm" />
            <span className={styles.name}>{getDisplayName(site)}</span>
            <button
              type="button"
              className={styles.remove}
              onClick={() => compare.remove(site.domain)}
              aria-label={t('compare.remove', { domain: site.domain })}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 7l10 10M17 7 7 17" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
      <span className={styles.count}>{t('compareTray.count', { count: compare.count, max: compare.max })}</span>
      <Link className={`btn ${styles.open}`} to={compareHref(domains)}>
        {t('compareTray.open')}
      </Link>
      <button type="button" className={styles.clear} onClick={compare.clear}>
        {t('compareTray.clear')}
      </button>
    </aside>
  );
}
