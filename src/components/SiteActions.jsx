import { useState } from 'react';
import { useCompare, useFavorites } from '../store/savedSites';
import { useI18n } from '../i18n';
import styles from './SiteActions.module.css';

/** Star: adds the site to / removes it from Saved (localStorage). */
export function SaveButton({ site, withLabel = false, className = '' }) {
  const { t } = useI18n();
  const favorites = useFavorites();
  const saved = favorites.has(site.domain);
  const label = saved ? t('saved.remove', { domain: site.domain }) : t('saved.add', { domain: site.domain });

  return (
    <button
      type="button"
      className={`${styles.action} ${withLabel ? styles.labelled : ''} ${saved ? styles.on : ''} ${className}`}
      aria-pressed={saved}
      aria-label={withLabel ? undefined : label}
      title={label}
      onClick={() => favorites.toggle(site)}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.star}>
        <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
      </svg>
      {withLabel && <span>{saved ? t('saved.savedLabel') : t('saved.saveLabel')}</span>}
    </button>
  );
}

/** Two bars: adds the site to / removes it from the comparison (max 4). */
export function CompareButton({ site, withLabel = false, className = '' }) {
  const { t } = useI18n();
  const compare = useCompare();
  const [bounce, setBounce] = useState(0);
  const picked = compare.has(site.domain);
  const blocked = !picked && compare.full;
  const label = picked
    ? t('compare.remove', { domain: site.domain })
    : blocked
      ? t('compare.full', { max: compare.max })
      : t('compare.add', { domain: site.domain });

  return (
    <button
      type="button"
      className={`${styles.action} ${withLabel ? styles.labelled : ''} ${picked ? styles.on : ''} ${className}`}
      aria-pressed={picked}
      aria-label={withLabel ? undefined : label}
      title={label}
      data-blocked={blocked || undefined}
      onClick={() => {
        if (!compare.toggle(site)) setBounce((n) => n + 1); // full: a short shake says "no room"
      }}
    >
      <svg key={bounce} viewBox="0 0 24 24" aria-hidden="true" className={bounce ? styles.shake : undefined}>
        <path d="M8 4v16M16 4v16M4 8h8M12 16h8" />
      </svg>
      {withLabel && <span>{picked ? t('compare.pickedLabel') : t('compare.pickLabel')}</span>}
    </button>
  );
}
