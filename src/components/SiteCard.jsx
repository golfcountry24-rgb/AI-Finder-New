import { Favicon } from './Favicon';
import { DrMeter } from './DrMeter';
import { CategoryTags } from './CategoryTags';
import { CompareButton, SaveButton } from './SiteActions';
import { daysAgo, formatAiSource, getDisplayName } from '../utils/format';
import { useI18n } from '../i18n';
import styles from './SiteCard.module.css';

const FRESH_DAYS = 45;

/**
 * Catalogue card. The whole card opens the detail view (stretched button),
 * while "Visit" stays an independent external link.
 */
export function SiteCard({ site, onOpen, activeCategory }) {
  const { t, formatDate } = useI18n();
  const name = getDisplayName(site);
  const launched = formatDate(site.wentLive);
  const age = daysAgo(site.wentLive);
  const isFresh = age !== null && age <= FRESH_DAYS;
  const builtWith = formatAiSource(site.aiSource, t);

  return (
    <article className={styles.card}>
      <header className={styles.top}>
        <Favicon domain={site.domain} />
        <div className={styles.ident}>
          <h3 className={styles.name}>
            <button type="button" className={styles.open} onClick={() => onOpen(site)}>
              {name}
            </button>
          </h3>
          <span className={`mono ${styles.domain}`}>{site.domain}</span>
        </div>
      </header>

      <p className={`${styles.summary} ${site.summary ? '' : styles.muted}`}>
        {site.summary ?? t('common.noDescription')}
      </p>

      <CategoryTags categories={site.categories} limit={2} active={activeCategory} />

      <footer className={styles.bottom}>
        <DrMeter value={site.dr} />
        <span className={styles.meta}>
          {isFresh && <span className={styles.fresh}>{t('common.newBadge')}</span>}
          {builtWith && <span className={styles.built}>{builtWith}</span>}
          {launched && (
            <time dateTime={site.wentLive} title={t('common.wentLiveHint')}>
              {launched}
            </time>
          )}
        </span>
      </footer>

      <div className={styles.tools}>
        <SaveButton site={site} />
        <CompareButton site={site} />
        {site.url && (
          <a
            className={styles.visit}
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('common.visitSiteNewTab', { domain: site.domain })}
            title={t('common.visitSite', { domain: site.domain })}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M5 11 11 5M6 5h5v5" />
            </svg>
          </a>
        )}
      </div>
    </article>
  );
}
