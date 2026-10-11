import { Favicon } from './Favicon';
import { DrMeter } from './DrMeter';
import { CategoryTags } from './CategoryTags';
import { CompareButton, SaveButton } from './SiteActions';
import { formatAiSource, getDisplayName } from '../utils/format';
import { useI18n } from '../i18n';
import styles from './NewSiteRow.module.css';

export function NewSiteRow({ site, onOpen, activeCategory }) {
  const { t, formatDate } = useI18n();
  const builtWith = formatAiSource(site.aiSource, t);
  const firstSeen = formatDate(site.firstSeen);

  return (
    <article className={styles.row}>
      <Favicon domain={site.domain} />
      <div className={styles.main}>
        <div className={styles.head}>
          <h3 className={styles.name}>
            <button type="button" className={styles.open} onClick={() => onOpen(site)}>
              {getDisplayName(site)}
            </button>
          </h3>
          <span className="mono">{site.domain}</span>
        </div>
        <p className={styles.summary}>{site.summary ?? t('common.noDescription')}</p>
        <CategoryTags categories={site.categories} limit={3} active={activeCategory} />
      </div>
      <dl className={styles.meta}>
        <div>
          <dt>{t('newPage.drLabel')}</dt>
          <dd>
            <DrMeter value={site.dr} compact />
          </dd>
        </div>
        {firstSeen && (
          <div>
            <dt>{t('newPage.firstSeen')}</dt>
            <dd>{firstSeen}</dd>
          </div>
        )}
        {builtWith && (
          <div>
            <dt>{t('newPage.builtWith')}</dt>
            <dd>{builtWith}</dd>
          </div>
        )}
      </dl>
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
