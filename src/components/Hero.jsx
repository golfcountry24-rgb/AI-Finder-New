import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useIndexStats } from '../hooks/useIndexStats';
import { useRecentLaunches } from '../hooks/useRecentLaunches';
import { useRevealUp } from '../motion/hooks';
import { useI18n } from '../i18n';
import { NoBreak } from '../i18n/NoBreak';
import { getDisplayName } from '../utils/format';
import { Favicon } from './Favicon';
import { SiteModal } from './SiteModal';
import styles from './Hero.module.css';

/** Category shortcuts: the same API values the catalogue filters use. */
const SHORTCUTS = [
  { id: 'AI Chatbot & Assistant', labelKey: 'filters.chat', icon: 'M4 5h16v11H9l-5 4z' },
  { id: 'Image Generation', labelKey: 'filters.image', icon: 'M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4M15 9h.01' },
  { id: 'Video Generation', labelKey: 'filters.video', icon: 'M3 6h12v12H3zM15 10l6-3v10l-6-3' },
  {
    id: 'Voice & Text-to-Speech',
    labelKey: 'filters.voice',
    icon: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
  },
  { id: 'Code & Dev Tools', labelKey: 'filters.code', icon: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16' },
  {
    id: 'AI Agents & Autonomous',
    labelKey: 'filters.agents',
    icon: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18',
  },
  {
    id: 'AI Automation & Workflows',
    labelKey: 'filters.automation',
    icon: 'M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4',
  },
  { id: 'Writing & Content', labelKey: 'filters.writing', icon: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4' },
];

const RING = 2 * Math.PI * 44; // circumference of the ratio ring (r = 44)

function RecentPill({ site, onOpen, hidden }) {
  const { formatDate } = useI18n();
  return (
    <li className={styles.pillItem} aria-hidden={hidden || undefined}>
      <button
        type="button"
        className={styles.pill}
        onClick={() => onOpen(site)}
        tabIndex={hidden ? -1 : undefined}
      >
        <Favicon domain={site.domain} size="sm" />
        <span className={styles.pillText}>
          <span className={styles.pillName}>{getDisplayName(site)}</span>
          {site.wentLive && <span className={`mono ${styles.pillDate}`}>{formatDate(site.wentLive)}</span>}
        </span>
      </button>
    </li>
  );
}

export function Hero({ children, onPickCategory }) {
  const stats = useIndexStats();
  const recent = useRecentLaunches();
  const [selected, setSelected] = useState(null);
  const { t, formatNumber } = useI18n();
  const root = useRef(null);
  useRevealUp(root, [], { distance: 36, step: 80 });

  const ratio = stats.all && typeof stats.startups === 'number' ? stats.startups / stats.all : null;
  const percent = ratio === null ? null : `${(ratio * 100).toFixed(1)}%`;

  return (
    <section ref={root} className={`container ${styles.hero}`} aria-labelledby="hero-title">
      <div className={styles.bento}>
        <div className={`${styles.tile} ${styles.main}`} data-reveal>
          <span className={styles.light} aria-hidden="true" />
          <div className={styles.copy}>
            <h1 id="hero-title" className={styles.title}>
              <NoBreak>{t('hero.titleStart')}</NoBreak> <NoBreak>{t('hero.titleSoft')}</NoBreak>.
            </h1>
            <p className={styles.lead}>{t('hero.lead')}</p>
          </div>
          <div className={styles.search}>{children}</div>
        </div>

        <div className={`${styles.tile} ${styles.live}`} data-reveal>
          <p className={styles.liveHead}>
            <span className={styles.pulse} aria-hidden="true" />
            {t('hero.eyebrow')}
          </p>
          <div>
            <p className={`${styles.bigNum} ${stats.all === null ? styles.pending : ''}`}>
              {stats.all === null ? '…' : formatNumber(stats.all)}
            </p>
            <p className={styles.liveLabel}>
              <NoBreak>{t('hero.statAll')}</NoBreak>
            </p>
          </div>
        </div>

        <div className={`${styles.tile} ${styles.ratio}`} data-reveal>
          <div className={styles.ring}>
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="44" className={styles.ringTrack} />
              {ratio !== null && (
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className={styles.ringValue}
                  style={{ strokeDasharray: `${ratio * RING} ${RING}`, '--ring': RING }}
                />
              )}
            </svg>
            <span className={`mono ${styles.ringText}`}>{percent ?? '…'}</span>
          </div>
          <div>
            <p className={`${styles.midNum} ${stats.startups === null ? styles.pending : ''}`}>
              {stats.startups === null ? '…' : formatNumber(stats.startups)}
            </p>
            <p className={styles.ratioLabel}>{t('hero.ratioLabel')}</p>
          </div>
        </div>

        <nav className={`${styles.tile} ${styles.browse}`} aria-labelledby="browse-title" data-reveal>
          <h2 id="browse-title" className={styles.tileTitle}>
            {t('hero.browseTitle')}
          </h2>
          <ul className={styles.cats}>
            {SHORTCUTS.map((item) => (
              <li key={item.id}>
                <button type="button" className={styles.cat} onClick={() => onPickCategory?.(item.id)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d={item.icon} />
                  </svg>
                  {t(item.labelKey)}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <section className={`${styles.tile} ${styles.recent}`} aria-labelledby="recent-title" data-reveal>
          <div className={styles.recentHead}>
            <h2 id="recent-title" className={styles.tileTitle}>
              {t('hero.recentTitle')}
            </h2>
            <Link to="/new" className={styles.recentLink}>
              {t('hero.recentAll')}
            </Link>
          </div>

          {recent.status === 'loading' && (
            <ul className={styles.strip} aria-hidden="true">
              {Array.from({ length: 4 }, (_, i) => (
                <li key={i} className={styles.pillSkeleton} />
              ))}
            </ul>
          )}

          {recent.status === 'error' && <p className={styles.recentNote}>{t('hero.recentError')}</p>}

          {recent.status === 'success' && recent.items.length > 0 && (
            <div className={styles.marquee} style={{ '--count': recent.items.length }}>
              <ul className={styles.track}>
                {recent.items.map((site) => (
                  <RecentPill key={site.domain} site={site} onOpen={setSelected} />
                ))}
                {/* second copy makes the loop seamless; hidden from assistive tech and the tab order */}
                {recent.items.map((site) => (
                  <RecentPill key={`${site.domain}-copy`} site={site} onOpen={setSelected} hidden />
                ))}
              </ul>
            </div>
          )}

          <p className={styles.recentNote}>{t('hero.recentHint')}</p>
        </section>
      </div>

      <SiteModal site={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
