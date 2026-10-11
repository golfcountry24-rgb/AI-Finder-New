import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Favicon } from '../components/Favicon';
import { DrMeter } from '../components/DrMeter';
import { CategoryTags } from '../components/CategoryTags';
import { CopyLink } from '../components/CopyLink';
import { SaveButton } from '../components/SiteActions';
import { EmptyState } from '../components/StateViews';
import { useSitesByDomain } from '../hooks/useSiteLookup';
import { cleanDomain } from '../services/freeserp';
import { COMPARE_MAX, useCompare } from '../store/savedSites';
import { useRevealUp } from '../motion/hooks';
import { useI18n } from '../i18n';
import { formatAiSource, getDisplayName } from '../utils/format';
import styles from './ComparePage.module.css';

/** ?d=a.com,b.com → ['a.com', 'b.com'] (valid hostnames only, no duplicates, at most COMPARE_MAX). */
function parseDomains(value) {
  const list = (value ?? '').split(',').map(cleanDomain).filter(Boolean);
  return [...new Set(list)].slice(0, COMPARE_MAX);
}

export function ComparePage() {
  const [params, setParams] = useSearchParams();
  const compare = useCompare();
  const { t, formatDate, formatRelative } = useI18n();
  const urlDomains = parseDomains(params.get('d'));
  const stored = compare.items.map((s) => s.domain);
  const domains = urlDomains.length > 0 ? urlDomains : stored;

  // the address always describes what's on screen, so it can be shared as is
  useEffect(() => {
    if (urlDomains.length === 0 && stored.length > 0) setParams({ d: stored.join(',') }, { replace: true });
  }, [urlDomains.length, stored, setParams]);

  const { items } = useSitesByDomain(domains, compare.items);
  const headRef = useRef(null);
  useRevealUp(headRef);

  const remove = (domain) => {
    compare.remove(domain);
    const next = domains.filter((d) => d !== domain);
    setParams(next.length ? { d: next.join(',') } : {}, { replace: true });
  };

  const clearAll = () => {
    compare.clear();
    setParams({}, { replace: true });
  };

  // highlight the strongest and the newest site (only when there is something to compare)
  const loaded = items.filter((i) => i.site);
  // a badge only means something when the values differ (three sites launched the same day: no "newest")
  const best = {};
  if (loaded.length >= 2) {
    const ratings = loaded.map((i) => i.site.dr).filter((v) => typeof v === 'number');
    if (new Set(ratings).size > 1) best.dr = Math.max(...ratings);
    const dates = loaded.map((i) => i.site.wentLive).filter(Boolean);
    if (new Set(dates).size > 1) best.newest = [...dates].sort().at(-1);
  }

  const rows = [
    { key: 'summary', render: (s) => <p className={styles.summary}>{s.summary ?? t('common.noDescription')}</p> },
    { key: 'categories', render: (s) => (s.categories.length ? <CategoryTags categories={s.categories} /> : '—') },
    {
      key: 'dr',
      render: (s) => (
        <div className={styles.dr}>
          <DrMeter value={s.dr} />
          {best.dr !== null && best.dr !== undefined && s.dr === best.dr && (
            <span className={styles.badge}>{t('comparePage.highest')}</span>
          )}
        </div>
      ),
    },
    {
      key: 'wentLive',
      render: (s) =>
        s.wentLive ? (
          <div className={styles.date}>
            <span className="mono">{formatDate(s.wentLive)}</span>
            <span className={styles.rel}>{formatRelative(s.wentLive)}</span>
            {best.newest && s.wentLive === best.newest && <span className={styles.badge}>{t('comparePage.newest')}</span>}
          </div>
        ) : (
          '—'
        ),
    },
    { key: 'firstSeen', render: (s) => <span className="mono">{formatDate(s.firstSeen) ?? '—'}</span> },
    { key: 'builtWith', render: (s) => formatAiSource(s.aiSource, t) ?? '—' },
    { key: 'webserver', render: (s) => <span className="mono">{s.webserver ?? '—'}</span> },
    { key: 'tld', render: (s) => <span className="mono">{s.tld ? `.${s.tld}` : '—'}</span> },
    { key: 'httpStatus', render: (s) => <span className="mono">{s.httpStatus ?? '—'}</span> },
  ];

  return (
    <div className={`container ${styles.page}`}>
      <header ref={headRef} className={`page-head ${styles.head}`}>
        <h1 className="page-title" data-reveal>
          {t('comparePage.title')} <span className="soft">{t('comparePage.titleSoft')}</span>
        </h1>
        <p className={styles.lead} data-reveal>
          {t('comparePage.lead', { max: COMPARE_MAX })}
        </p>
        {domains.length > 0 && (
          <div className={styles.toolbar} data-reveal>
            <CopyLink />
            <Link className="btn btn--ghost" to="/">
              {t('comparePage.addMore')}
            </Link>
            <button type="button" className="btn btn--ghost" onClick={clearAll}>
              {t('comparePage.clear')}
            </button>
          </div>
        )}
      </header>

      {domains.length === 0 ? (
        <div className={styles.empty}>
          <EmptyState
            title={t('comparePage.emptyTitle')}
            action={
              <Link className="btn" to="/">
                {t('favoritesPage.browse')}
              </Link>
            }
          >
            {t('comparePage.emptyText')}
          </EmptyState>
        </div>
      ) : (
        <>
          {domains.length === 1 && <p className={styles.note}>{t('comparePage.needMore')}</p>}
          <div className={styles.scroller} tabIndex={0} aria-label={t('comparePage.tableLabel')}>
            <table className={styles.table} style={{ '--cols': items.length }}>
              <thead>
                <tr>
                  <th scope="col" className={styles.corner}>
                    <span className="visually-hidden">{t('comparePage.field')}</span>
                  </th>
                  {items.map((item) => (
                    <th key={item.domain} scope="col" className={styles.siteHead}>
                      <div className={styles.siteCell}>
                        <Favicon domain={item.domain} />
                        <div className={styles.siteName}>
                          {item.site ? (
                            <Link to={`/site/${item.domain}`}>{getDisplayName(item.site)}</Link>
                          ) : (
                            <span>{item.domain}</span>
                          )}
                          <span className="mono">{item.domain}</span>
                        </div>
                        <button
                          type="button"
                          className={styles.remove}
                          onClick={() => remove(item.domain)}
                          aria-label={t('comparePage.removeColumn', { domain: item.domain })}
                          title={t('comparePage.removeColumn', { domain: item.domain })}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M6 6l12 12M18 6 6 18" />
                          </svg>
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key}>
                    <th scope="row">{t(`comparePage.fields.${row.key}`)}</th>
                    {items.map((item) => (
                      <td key={item.domain}>
                        {item.site ? (
                          row.render(item.site)
                        ) : item.status === 'loading' ? (
                          <span className={styles.skeleton} />
                        ) : row.key === 'summary' ? (
                          <span className={styles.missing}>
                            {item.status === 'notfound' ? t('comparePage.notFound') : t('states.errorTitle')}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className={styles.actionsRow}>
                  <th scope="row">
                    <span className="visually-hidden">{t('comparePage.fields.links')}</span>
                  </th>
                  {items.map((item) => (
                    <td key={item.domain}>
                      {item.site && (
                        <div className={styles.cellActions}>
                          {item.site.url && (
                            <a className="btn" href={item.site.url} target="_blank" rel="noopener noreferrer">
                              {t('comparePage.visit')} <span aria-hidden="true">↗</span>
                            </a>
                          )}
                          <SaveButton site={item.site} />
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
