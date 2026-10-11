import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SiteCard } from '../components/SiteCard';
import { SiteModal } from '../components/SiteModal';
import { EmptyState } from '../components/StateViews';
import { useFavorites } from '../store/savedSites';
import { useListReveal, useRevealUp } from '../motion/hooks';
import { useI18n } from '../i18n';
import grid from '../components/SiteResults.module.css';
import styles from './FavoritesPage.module.css';

/** Sites saved with the star, newest first. They live in this browser only. */
export function FavoritesPage() {
  const favorites = useFavorites();
  const { t, formatNumber } = useI18n();
  const [selected, setSelected] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const items = useMemo(() => [...favorites.items].reverse(), [favorites.items]);

  const headRef = useRef(null);
  const listRef = useRef(null);
  useRevealUp(headRef);
  useListReveal(listRef, items);

  // "Clear all" asks for a second click instead of a browser dialog
  useEffect(() => {
    if (!confirming) return undefined;
    const timer = setTimeout(() => setConfirming(false), 3500);
    return () => clearTimeout(timer);
  }, [confirming]);

  const clear = () => {
    if (!confirming) return setConfirming(true);
    favorites.clear();
    setConfirming(false);
  };

  return (
    <div className={`container ${styles.page}`}>
      <header ref={headRef} className={`page-head ${styles.head}`}>
        <h1 className="page-title" data-reveal>
          {t('favoritesPage.title')} <span className="soft">{formatNumber(favorites.count)}</span>
        </h1>
        <p className={styles.lead} data-reveal>
          {t('favoritesPage.lead')}
        </p>
        {favorites.count > 0 && (
          <div className={styles.actions} data-reveal>
            <button type="button" className={`btn btn--ghost ${confirming ? styles.danger : ''}`} onClick={clear}>
              {confirming ? t('favoritesPage.confirmClear') : t('favoritesPage.clear')}
            </button>
          </div>
        )}
      </header>

      {favorites.count === 0 ? (
        <div className={styles.empty}>
          <EmptyState
            title={t('favoritesPage.emptyTitle')}
            action={
              <Link className="btn" to="/">
                {t('favoritesPage.browse')}
              </Link>
            }
          >
            {t('favoritesPage.emptyText')}
          </EmptyState>
        </div>
      ) : (
        <ul ref={listRef} className={`${grid.grid} ${styles.list}`}>
          {items.map((site, index) => (
            <li key={site.domain} data-item className={index % 6 === 1 || index % 6 === 5 ? 'card-ink' : undefined}>
              <SiteCard site={site} onOpen={setSelected} />
            </li>
          ))}
        </ul>
      )}

      <SiteModal site={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
