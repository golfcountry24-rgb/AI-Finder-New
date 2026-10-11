import { useRef, useState } from 'react';
import { useListReveal } from '../motion/hooks';
import { useI18n } from '../i18n';
import { SiteCard } from './SiteCard';
import { SiteModal } from './SiteModal';
import { EmptyState, ErrorState, LoadMore, SkeletonGrid } from './StateViews';
import styles from './SiteResults.module.css';

/** Grid of site cards with loading / error / empty states, "Load more" and the detail modal. */
export function SiteResults({ sites, activeCategory, emptyTitle, emptyText, onReset }) {
  const [selected, setSelected] = useState(null);
  const { t } = useI18n();
  const listRef = useRef(null);
  useListReveal(listRef, sites.status === 'success' ? sites.items : null);

  if (sites.status === 'loading') return <SkeletonGrid count={6} />;
  if (sites.status === 'error') return <ErrorState error={sites.error} onRetry={sites.retry} />;
  if (sites.items.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        action={
          onReset && (
            <button type="button" className="btn" onClick={onReset}>
              {t('explore.reset')}
            </button>
          )
        }
      >
        {emptyText}
      </EmptyState>
    );
  }

  return (
    <>
      <ul ref={listRef} className={`${styles.grid} ${sites.refreshing ? 'is-refreshing' : ''}`} aria-busy={sites.refreshing}>
        {sites.items.map((site, index) => (
          // every 2nd and 6th card of each group of six is an ink tile: a steady diagonal rhythm
          <li key={site.domain} data-item className={index % 6 === 1 || index % 6 === 5 ? 'card-ink' : undefined}>
            <SiteCard site={site} onOpen={setSelected} activeCategory={activeCategory} />
          </li>
        ))}
      </ul>

      {(sites.hasMore || sites.loadMoreError) && (
        <LoadMore
          onClick={sites.loadMore}
          loading={sites.loadingMore}
          error={sites.loadMoreError}
          shown={sites.items.length}
          total={sites.total}
        />
      )}

      <SiteModal site={selected} onClose={() => setSelected(null)} />
    </>
  );
}
