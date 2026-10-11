import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useRevealUp, useScrollReveal } from '../motion/hooks';
import { useIndexStats } from '../hooks/useIndexStats';
import { useI18n } from '../i18n';
import { NoBreak } from '../i18n/NoBreak';
import styles from './AboutPage.module.css';

const FIELDS = [
  ['title', 'title'],
  ['ai_summary', 'ai_summary'],
  ['ai_categories', 'ai_categories'],
  ['dr', 'dr'],
  ['went_live', 'went_live'],
  ['first_seen', 'first_seen'],
  ['ai_source', 'ai_source'],
  ['tld · webserver · http_status', 'tech'],
];

export function AboutPage() {
  const stats = useIndexStats();
  const { t, formatNumber } = useI18n();
  const root = useRef(null);
  useRevealUp(root);
  useScrollReveal(root);

  const figure = (value) => (value === null ? '…' : formatNumber(value));

  return (
    <div ref={root} className={`container ${styles.page}`}>
      <header className={`page-head ${styles.intro}`}>
        <p className="eyebrow" data-reveal>
          {t('about.eyebrow')}
        </p>
        <h1 className="page-title" data-reveal>
          <NoBreak>{t('about.titleStart')}</NoBreak> <span className="soft">{t('about.titleSoft')}</span>
          <span className="accent-dot">.</span>
        </h1>
        <p className={styles.lead} data-reveal>
          {t('about.lead')}
        </p>
      </header>

      <div className={styles.bento}>
        <section className={`${styles.tile} ${styles.goal}`} data-reveal-scroll>
          <h2>{t('about.goalTitle')}</h2>
          <p>{t('about.goalText')}</p>
        </section>
        <section className={styles.tile} data-reveal-scroll>
          <h2>{t('about.audienceTitle')}</h2>
          <p>{t('about.audienceText')}</p>
        </section>
        <section className={styles.tile} data-reveal-scroll>
          <h2>{t('about.dataTitle')}</h2>
          <p>
            {t('about.dataTextStart')}{' '}
            <a href="https://freeserp.ai" target="_blank" rel="noreferrer">
              FreeSerp
            </a>
            {t('about.dataTextEnd').startsWith('.') ? '' : ' '}
            {t('about.dataTextEnd')}
          </p>
        </section>
        <section className={`${styles.tile} ${styles.numbers}`} data-reveal-scroll>
          <h2>{t('about.nicheTitle')}</h2>
          <div className={styles.figures}>
            <div>
              <strong>{figure(stats.all)}</strong>
              <span>
                <NoBreak>{t('about.nicheAll')}</NoBreak>
              </span>
            </div>
            <div>
              <strong>{figure(stats.startups)}</strong>
              <span>
                <NoBreak>{t('about.nicheStartups')}</NoBreak>
              </span>
            </div>
          </div>
        </section>
      </div>

      <section className={styles.api} data-reveal-scroll>
        <div className={styles.apiText}>
          <h2>{t('about.apiTitle')}</h2>
          <p>
            {t('about.apiText1Start')} <b>{t('about.apiText1Main')}</b> {t('about.apiText1Index')} (
            <code>index=sites</code>) {t('about.apiText1Rest')} <code>category=ai</code> {t('about.apiText1And')}{' '}
            <code>ai_startups=1</code>.
          </p>
          <p>{t('about.apiText2')}</p>
          <pre className={styles.code}>
            <code>
              GET https://freeserp.ai/api.php{'\n'}
              {'  '}?index=sites&amp;category=ai{'\n'}
              {'  '}&amp;q=video&amp;ai_categories=Video+Generation{'\n'}
              {'  '}&amp;sort=went_live&amp;order=desc&amp;from=0&amp;size=24
            </code>
          </pre>
          <a className="btn btn--ghost" href="https://freeserp.ai/docs.php" target="_blank" rel="noreferrer">
            {t('about.apiDocs')} <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className={styles.fields}>
          <h3>{t('about.fieldsTitle')}</h3>
          <dl>
            {FIELDS.map(([name, key]) => (
              <div key={name}>
                <dt>{name}</dt>
                <dd>{t(`about.fields.${key}`)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <p className={styles.cta} data-reveal-scroll>
        {t('about.cta')}{' '}
        <Link className="link" to="/">
          {t('about.ctaLink')}
        </Link>
      </p>
    </div>
  );
}
