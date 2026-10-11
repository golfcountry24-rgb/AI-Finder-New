import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Favicon } from '../components/Favicon';
import { DrMeter } from '../components/DrMeter';
import { CompareButton, SaveButton } from '../components/SiteActions';
import { CopyLink } from '../components/CopyLink';
import { SiteCard } from '../components/SiteCard';
import { SiteModal } from '../components/SiteModal';
import { EmptyState, ErrorState } from '../components/StateViews';
import { useSite } from '../hooks/useSiteLookup';
import { useSites } from '../hooks/useSites';
import { useSiteSeo } from '../seo/useSeo';
import { useListReveal, useRevealUp } from '../motion/hooks';
import { useI18n } from '../i18n';
import { CATEGORY_FILTERS } from '../utils/constants';
import { formatAiSource, getDisplayName } from '../utils/format';
import styles from './SitePage.module.css';

const FILTER_IDS = new Set(CATEGORY_FILTERS.map((c) => c.id));

function Similar({ site }) {
  const { t, category } = useI18n();
  const [selected, setSelected] = useState(null);
  const listRef = useRef(null);
  const main = site.categories[0] ?? '';
  const sites = useSites({ aiCategory: main, sort: 'dr', order: 'desc', size: 7 });
  const items = useMemo(() => sites.items.filter((s) => s.domain !== site.domain).slice(0, 6), [sites.items, site.domain]);
  useListReveal(listRef, sites.status === 'success' ? items : null);
  if (!main || sites.status !== 'success' || items.length === 0) return null;

  return (
    <section className={styles.similar} aria-labelledby="similar-title">
      <div className={styles.similarHead}>
        <h2 id="similar-title">{t('sitePage.similar', { category: category(main) })}</h2>
        {FILTER_IDS.has(main) && (
          <Link className="link" to={`/?cat=${encodeURIComponent(main)}`}>
            {t('sitePage.seeAll')}
          </Link>
        )}
      </div>
      <ul ref={listRef} className={styles.grid}>
        {items.map((s, index) => (
          <li key={s.domain} data-item className={index % 6 === 1 || index % 6 === 5 ? 'card-ink' : undefined}>
            <SiteCard site={s} onOpen={setSelected} activeCategory={main} />
          </li>
        ))}
      </ul>
      <SiteModal site={selected} onClose={() => setSelected(null)} />
    </section>
  );
}

function SiteDetails({ site }) {
  const { t, formatDate, formatRelative, category } = useI18n();
  const root = useRef(null);
  useRevealUp(root, [site.domain], { distance: 32, step: 80 });
  const name = getDisplayName(site);

  const facts = [
    { key: 'wentLive', value: formatDate(site.wentLive), hint: formatRelative(site.wentLive) },
    { key: 'firstSeen', value: formatDate(site.firstSeen) },
    { key: 'builtWith', value: formatAiSource(site.aiSource, t) },
    { key: 'webserver', value: site.webserver },
    { key: 'tld', value: site.tld ? `.${site.tld}` : null },
    { key: 'httpStatus', value: site.httpStatus },
    { key: 'crawled', value: formatDate(site.fetchedAt) },
  ].filter((f) => f.value !== null && f.value !== undefined && f.value !== '');

  return (
    <div ref={root} className={styles.bento}>
      <article className={`${styles.tile} ${styles.main}`} data-reveal>
        <span className={styles.light} aria-hidden="true" />
        <nav className={styles.crumbs} aria-label={t('sitePage.breadcrumbs')}>
          <Link to="/">{t('nav.explore')}</Link>
          <span aria-hidden="true">/</span>
          <span className="mono">{site.domain}</span>
        </nav>
        <div className={styles.ident}>
          <Favicon domain={site.domain} size="lg" />
          <div>
            <h1 className={styles.name}>{name}</h1>
            <span className={`mono ${styles.domain}`}>{site.domain}</span>
          </div>
        </div>
        <p className={styles.summary}>{site.summary ?? t('modal.noSummary')}</p>
        {site.title && <p className={styles.pageTitle}>“{site.title}”</p>}
        <div className={styles.actions}>
          {site.url && (
            <a className="btn" href={site.url} target="_blank" rel="noopener noreferrer">
              {t('modal.visit')} <span aria-hidden="true">↗</span>
            </a>
          )}
          <SaveButton site={site} withLabel />
          <CompareButton site={site} withLabel />
          <CopyLink />
        </div>
      </article>

      <aside className={`${styles.tile} ${styles.rating}`} aria-label={t('modal.signals')} data-reveal>
        <span className={styles.ratingLabel}>{t('newPage.drLabel')}</span>
        <span className={styles.ratingValue}>{site.dr ?? t('card.na')}</span>
        <DrMeter value={site.dr} />
      </aside>

      <section className={`${styles.tile} ${styles.facts}`} aria-labelledby="facts-title" data-reveal>
        <h2 id="facts-title" className={styles.tileTitle}>
          {t('modal.signals')}
        </h2>
        <dl>
          {facts.map((fact) => (
            <div key={fact.key}>
              <dt>{t(`modal.${fact.key}`)}</dt>
              <dd>
                {fact.value}
                {fact.hint && <span className={styles.hint}>{fact.hint}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {site.categories.length > 0 && (
        <section className={`${styles.tile} ${styles.cats}`} aria-labelledby="cats-title" data-reveal>
          <h2 id="cats-title" className={styles.tileTitle}>
            {t('modal.categories')}
          </h2>
          <ul>
            {site.categories.map((cat) => (
              <li key={cat}>
                {FILTER_IDS.has(cat) ? (
                  <Link to={`/?cat=${encodeURIComponent(cat)}`}>{category(cat)}</Link>
                ) : (
                  <span>{category(cat)}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function SitePage() {
  const { domain: raw } = useParams();
  const { t, lang } = useI18n();
  const lookup = useSite(raw);
  useSiteSeo(lookup, lang);

  return (
    <div className={`container ${styles.page}`}>
      {lookup.status === 'loading' && (
        <div className={styles.bento} role="status" aria-label={t('states.loading')}>
          <div className={`${styles.tile} ${styles.main} ${styles.skeleton}`} />
          <div className={`${styles.tile} ${styles.rating} ${styles.skeleton}`} />
          <div className={`${styles.tile} ${styles.facts} ${styles.skeleton}`} />
        </div>
      )}
      {lookup.status === 'error' && <ErrorState error={lookup.error} onRetry={lookup.retry} />}
      {lookup.status === 'notfound' && (
        <EmptyState
          as="h1"
          title={t('sitePage.notFoundTitle', { domain: lookup.domain ?? raw })}
          action={
            <Link className="btn" to={lookup.domain ? `/?q=${encodeURIComponent(lookup.domain)}` : '/'}>
              {t('sitePage.searchInstead')}
            </Link>
          }
        >
          {t('sitePage.notFoundText')}
        </EmptyState>
      )}
      {lookup.status === 'success' && (
        <>
          <SiteDetails site={lookup.site} />
          <Similar key={lookup.site.domain} site={lookup.site} />
        </>
      )}
    </div>
  );
}
