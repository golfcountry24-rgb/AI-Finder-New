import { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FilterChips } from '../components/FilterChips';
import { Toggle } from '../components/Toggle';
import { NewSiteRow } from '../components/NewSiteRow';
import { SiteModal } from '../components/SiteModal';
import { EmptyState, ErrorState, LoadMore, SkeletonGrid } from '../components/StateViews';
import { useSites } from '../hooks/useSites';
import { useKeepInView } from '../hooks/useKeepInView';
import { CATEGORY_FILTERS } from '../utils/constants';
import { useListReveal, useRevealUp } from '../motion/hooks';
import { useI18n } from '../i18n';
import { NoBreak } from '../i18n/NoBreak';
import styles from './NewPage.module.css';

const SIZE = 30;

/** Groups already-sorted sites by their went_live date. */
function groupByDate(items) {
  const groups = [];
  items.forEach((site) => {
    const key = site.wentLive ?? 'unknown';
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(site);
    else groups.push({ key, items: [site] });
  });
  return groups;
}

export function NewPage() {
  // filters live in the URL like on Explore: /new?cat=Video%20Generation&ai=0
  const [params, setParams] = useSearchParams();
  const catParam = params.get('cat') ?? '';
  const category = CATEGORY_FILTERS.some((c) => c.id === catParam) ? catParam : '';
  const aiStartups = params.get('ai') !== '0'; // on by default here
  const setFilter = (key, value) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === null) next.delete(key);
      else next.set(key, value);
      return next;
    });
  const setCategory = (cat) => setFilter('cat', cat || null);
  const setAiStartups = (on) => setFilter('ai', on ? null : '0');
  const [selected, setSelected] = useState(null);
  const { t, formatDate, formatRelative } = useI18n();

  const sites = useSites({ aiCategory: category, aiStartups, sort: 'went_live', order: 'desc', size: SIZE });
  const groups = useMemo(() => groupByDate(sites.items), [sites.items]);

  const introRef = useRef(null);
  const timelineRef = useRef(null);
  const toolbarRef = useRef(null);
  useKeepInView(toolbarRef, [category, aiStartups]);

  useRevealUp(introRef);
  // date labels and rows slide up; on "Load more" only the new ones
  useListReveal(timelineRef, sites.status === 'success' ? sites.items : null);

  return (
    <div ref={introRef} className="container">
      <header className={`page-head ${styles.intro}`}>
        <p className="eyebrow" data-reveal>
          {t('newPage.eyebrow')}
        </p>
        <h1 className="page-title" data-reveal>
          <NoBreak>{t('newPage.title')}</NoBreak> <span className="soft">{t('newPage.titleSoft')}</span>
          <span className="accent-dot">.</span>
        </h1>
        <p className={styles.lead} data-reveal>
          {t('newPage.leadStart')} <b>went_live</b>
          {t('newPage.leadEnd')}
        </p>
      </header>

      <div ref={toolbarRef} className={styles.toolbar} data-reveal>
        <FilterChips options={CATEGORY_FILTERS} value={category} onChange={setCategory} />
        <Toggle
          checked={aiStartups}
          onChange={setAiStartups}
          label={t('common.aiProductsOnly')}
          hint={t('common.aiProductsHint')}
        />
      </div>

      {sites.status === 'loading' && <SkeletonGrid count={4} variant="list" />}
      {sites.status === 'error' && <ErrorState error={sites.error} onRetry={sites.retry} />}
      {sites.status === 'success' && sites.items.length === 0 && (
        <EmptyState title={t('newPage.emptyTitle')}>
          {t('newPage.emptyText')}
        </EmptyState>
      )}

      {sites.status === 'success' && sites.items.length > 0 && (
        <>
          <ol
            ref={timelineRef}
            className={`${styles.timeline} ${sites.refreshing ? 'is-refreshing' : ''}`}
            aria-busy={sites.refreshing}
          >
            {groups.map((group) => (
              <li key={group.key} className={styles.day}>
                <div className={styles.date} data-item>
                  <span className={styles.rail} aria-hidden="true" />
                  <h2 className={styles.dateHeading}>
                    <time dateTime={group.key}>{formatDate(group.key) ?? t('newPage.dateUnknown')}</time>
                  </h2>
                  <span>
                    {t('newPage.shownInGroup', { relative: formatRelative(group.key) ?? '', count: group.items.length })}
                  </span>
                </div>
                <ul className={styles.items}>
                  {group.items.map((site) => (
                    <li key={site.domain} data-item>
                      <NewSiteRow site={site} onOpen={setSelected} activeCategory={category} />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>

          {(sites.hasMore || sites.loadMoreError) && (
            <LoadMore
              onClick={sites.loadMore}
              loading={sites.loadingMore}
              error={sites.loadMoreError}
              shown={sites.items.length}
              total={sites.total}
            />
          )}
        </>
      )}

      <SiteModal site={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
