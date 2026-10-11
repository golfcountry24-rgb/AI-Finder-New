import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import styles from './FilterChips.module.css';

/**
 * Category filter as one horizontally scrollable track.
 * Arrow buttons appear only when there is something to scroll to.
 */
export function FilterChips({ options, value, onChange }) {
  const { t } = useI18n();
  const trackRef = useRef(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft > 4,
      end: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(el);
    return () => {
      el.removeEventListener('scroll', measure);
      observer?.disconnect();
    };
  }, [measure]);

  const scrollBy = (direction) => {
    const el = trackRef.current;
    el?.scrollBy({ left: direction * el.clientWidth * 0.6, behavior: 'smooth' });
  };

  return (
    <div className={`${styles.wrap} ${edges.start ? styles.fadeStart : ''} ${edges.end ? styles.fadeEnd : ''}`}>
      {edges.start && (
        <button type="button" className={`${styles.arrow} ${styles.left}`} onClick={() => scrollBy(-1)} aria-label={t('filters.scrollLeft')}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M10 3 5 8l5 5" />
          </svg>
        </button>
      )}
      <div ref={trackRef} className={styles.track} role="group" aria-label={t('filters.label')}>
        {options.map((option) => {
          const active = option.id === value;
          return (
            <button
              key={option.id || 'all'}
              type="button"
              className={`${styles.chip} ${active ? styles.active : ''}`}
              aria-pressed={active}
              onClick={(event) => {
                event.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                onChange(option.id);
              }}
              title={option.id || t('filters.allTitle')}
            >
              {t(option.labelKey)}
            </button>
          );
        })}
      </div>
      {edges.end && (
        <button type="button" className={`${styles.arrow} ${styles.right}`} onClick={() => scrollBy(1)} aria-label={t('filters.scrollRight')}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="m6 3 5 5-5 5" />
          </svg>
        </button>
      )}
    </div>
  );
}
