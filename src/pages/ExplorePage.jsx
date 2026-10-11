import { useEffect, useRef, useState } from 'react';
import { Hero } from '../components/Hero';
import { SearchBar } from '../components/SearchBar';
import { FilterChips } from '../components/FilterChips';
import { Select } from '../components/Select';
import { Toggle } from '../components/Toggle';
import { SiteResults } from '../components/SiteResults';
import { useDebounce } from '../hooks/useDebounce';
import { useRevealUp } from '../motion/hooks';
import { prefersReducedMotion } from '../motion';
import { useI18n } from '../i18n';
import { useExploreParams } from '../hooks/useExploreParams';
import { useSites } from '../hooks/useSites';
import { useKeepInView } from '../hooks/useKeepInView';
import { CATEGORY_FILTERS, PAGE_SIZE, SORT_OPTIONS } from '../utils/constants';
import styles from './ExplorePage.module.css';

export function ExplorePage() {
  const [{ q, category, aiStartups, sortId }, update] = useExploreParams();
  const [input, setInput] = useState(q);
  const { t, formatNumber } = useI18n();
  const debounced = useDebounce(input, 400);

  // debounced input → URL
  useEffect(() => {
    if (debounced.trim() !== q) update({ q: debounced.trim(), sort: '' }, { replace: true });
  }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  // URL → input (back/forward navigation), adjusted during render instead of in an effect
  const [syncedQ, setSyncedQ] = useState(q);
  if (syncedQ !== q) {
    setSyncedQ(q);
    // only when the change came from outside (Back/Forward, a link), not from our own debounce
    if (input.trim() !== q && debounced.trim() !== q) setInput(q);
  }

  const sort = SORT_OPTIONS.find((s) => s.id === sortId);
  const sites = useSites({
    q,
    aiCategory: category,
    aiStartups,
    sort: sort.sort,
    order: sort.order,
    size: PAGE_SIZE,
  });

  const catalogRef = useRef(null);
  const toolbarRef = useRef(null);
  useRevealUp(catalogRef);
  // changing a filter deep in the list scrolls back to the filters, not to the footer
  useKeepInView(toolbarRef, [category, aiStartups, sortId]);
  const busy = sites.status === 'loading' || sites.refreshing;

  const sortOptions = SORT_OPTIONS.filter((s) => !s.needsQuery || q);
  const hasFilters = Boolean(q || category || aiStartups);
  const resetAll = () => {
    setInput('');
    update({ q: '', cat: '', ai: false, sort: '' });
  };

  /** Brings the catalogue toolbar to just under the sticky header. */
  const scrollToCatalog = () => {
    const el = toolbarRef.current;
    if (!el) return;
    const header = document.querySelector('header');
    const offset = (header ? header.getBoundingClientRect().bottom : 0) + 12;
    window.scrollTo({
      top: window.scrollY + el.getBoundingClientRect().top - offset,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  };

  // "Search" applies the query at once instead of waiting for the debounce
  const submitSearch = (value) => {
    const next = value.trim();
    if (next !== q) update({ q: next, sort: '' }, { replace: true });
    scrollToCatalog();
  };

  // category shortcuts in the hero use the same filter as the chips
  const pickCategory = (cat) => {
    update({ cat });
    scrollToCatalog();
  };

  return (
    <>
      <Hero onPickCategory={pickCategory}>
        <SearchBar
          value={input}
          onChange={setInput}
          onSubmit={submitSearch}
          pending={input.trim() !== q || (busy && Boolean(q))}
        />
      </Hero>

      <section ref={catalogRef} className={`container ${styles.catalog}`} aria-labelledby="catalog-title">
        <div ref={toolbarRef} className={styles.toolbar} data-reveal>
          <div className={styles.row}>
            <div className={styles.heading}>
              <h2 id="catalog-title" className={styles.title}>
                {t('explore.heading')}
              </h2>
              <p className={styles.count} aria-live="polite">
                {sites.status === 'success' && !sites.refreshing ? (
                  <>
                    <strong>{formatNumber(sites.total)}</strong> {t('explore.sitesWord', { count: sites.total })}
                    {q && (
                      <>
                        {' '}
                        {t('explore.sitesFor')} <mark>“{q}”</mark>
                      </>
                    )}
                  </>
                ) : busy ? (
                  t('explore.searching')
                ) : (
                  t('explore.noData')
                )}
              </p>
            </div>
            <div className={styles.controls}>
              <Toggle
                checked={aiStartups}
                onChange={(checked) => update({ ai: checked })}
                label={t('common.aiProductsOnly')}
                hint={t('common.aiProductsHint')}
              />
              <Select
                label={t('sort.label')}
                options={sortOptions.map((o) => ({ id: o.id, label: t(o.labelKey) }))}
                value={sortId}
                onChange={(value) => update({ sort: value })}
              />
            </div>
          </div>

          <FilterChips options={CATEGORY_FILTERS} value={category} onChange={(cat) => update({ cat })} />
        </div>

        <SiteResults
          sites={sites}
          activeCategory={category}
          emptyTitle={q ? t('explore.emptyQuery', { q }) : t('explore.emptyFilters')}
          emptyText={t('explore.emptyText')}
          onReset={hasFilters ? resetAll : undefined}
        />
      </section>
    </>
  );
}
