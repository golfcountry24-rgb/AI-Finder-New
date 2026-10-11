import { useCallback, useLayoutEffect, useRef } from 'react';
import { Favicon } from './Favicon';
import { DrMeter } from './DrMeter';
import { Link } from 'react-router-dom';
import { CategoryTags } from './CategoryTags';
import { CompareButton, SaveButton } from './SiteActions';
import { formatAiSource, getDisplayName } from '../utils/format';
import { useI18n } from '../i18n';
import { prefersReducedMotion } from '../motion';
import { useRevealUp } from '../motion/hooks';
import styles from './SiteModal.module.css';

const CLOSE_MS = 320; // keep in sync with the modal-out animation in SiteModal.module.css

/**
 * Detail view built on the native <dialog>: focus trapping, Esc to close
 * and focus restoration come from the browser.
 * Open/close are CSS animations of the dialog AND its backdrop together,
 * so closing is as smooth as opening (no instant backdrop cut).
 */
export function SiteModal({ site, onClose }) {
  const ref = useRef(null);
  const closing = useRef(false);

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (site && !dialog.open) {
      closing.current = false;
      dialog.removeAttribute('data-state');
      dialog.showModal();
      // the <dialog> is reused for every site: always start at the top of the card,
      // not where the previous one was scrolled to (or where focus scrolled it)
      dialog.scrollTop = 0;
      requestAnimationFrame(() => {
        dialog.scrollTop = 0;
      });
    }
    if (!site && dialog.open) dialog.close();
  }, [site]);

  /** Play the exit animation, then let React clear the selection (which closes the dialog). */
  const requestClose = useCallback(() => {
    const dialog = ref.current;
    if (!dialog || closing.current) return;
    closing.current = true;
    if (prefersReducedMotion()) {
      onClose();
      return;
    }
    dialog.setAttribute('data-state', 'closing');
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      dialog.removeEventListener('animationend', onEnd);
      onClose();
    };
    const onEnd = (event) => {
      if (event.target === dialog) finish();
    };
    dialog.addEventListener('animationend', onEnd);
    setTimeout(finish, CLOSE_MS + 120); // safety net
  }, [onClose]);

  // lock page scroll while open
  useLayoutEffect(() => {
    if (!site) return undefined;
    // like Bootstrap: compensate the vanished page scrollbar so nothing jumps sideways
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const prev = { overflow: document.body.style.overflow, padding: document.body.style.paddingRight };
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    return () => {
      document.body.style.overflow = prev.overflow;
      document.body.style.paddingRight = prev.padding;
    };
  }, [site]);

  const handleBackdrop = (event) => {
    if (event.target === ref.current) requestClose();
  };

  const handleCancel = (event) => {
    // Esc: run the exit animation instead of closing instantly
    event.preventDefault();
    requestClose();
  };

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      onClose={onClose}
      onCancel={handleCancel}
      onClick={handleBackdrop}
      aria-labelledby="site-modal-title"
    >
      {site && <ModalBody key={site.domain} site={site} onClose={requestClose} />}
    </dialog>
  );
}

function ModalBody({ site, onClose }) {
  const root = useRef(null);
  const { t, formatDate, formatRelative } = useI18n();
  useRevealUp(root, [], { distance: 12, duration: 600, step: 50, delay: 60 });

  const facts = [
    { key: 'wentLive', value: formatDate(site.wentLive), hint: formatRelative(site.wentLive) },
    { key: 'firstSeen', value: formatDate(site.firstSeen) },
    { key: 'builtWith', value: formatAiSource(site.aiSource, t) },
    { key: 'tld', value: site.tld ? `.${site.tld}` : null },
    { key: 'webserver', value: site.webserver },
    { key: 'httpStatus', value: site.httpStatus },
    { key: 'crawled', value: formatDate(site.fetchedAt) },
  ].filter((fact) => fact.value !== null && fact.value !== undefined && fact.value !== '');

  return (
    <div ref={root} className={styles.body}>
      <button type="button" className={styles.close} onClick={onClose} aria-label={t('modal.close')}>
        <span aria-hidden="true">×</span>
      </button>

      <div className={styles.head} data-reveal>
        <Favicon domain={site.domain} size="lg" />
        <div className={styles.titles}>
          <h2 id="site-modal-title" className={styles.name}>
            {getDisplayName(site)}
          </h2>
          <span className="mono">{site.domain}</span>
        </div>
      </div>

      {site.title && (
        <p className={styles.pageTitle} data-reveal>
          “{site.title}”
        </p>
      )}

      <section className={styles.section} data-reveal>
        <h3 className={styles.label}>{t('modal.summary')}</h3>
        <p className={styles.summary}>{site.summary ?? t('modal.noSummary')}</p>
      </section>

      {site.categories.length > 0 && (
        <section className={styles.section} data-reveal>
          <h3 className={styles.label}>{t('modal.categories')}</h3>
          <CategoryTags categories={site.categories} />
        </section>
      )}

      <section className={styles.section} data-reveal>
        <h3 className={styles.label}>{t('modal.signals')}</h3>
        <div className={styles.drRow}>
          <DrMeter value={site.dr} />
        </div>
        <dl className={styles.facts}>
          {facts.map((fact) => (
            <div key={fact.key}>
              <dt>{t(`modal.${fact.key}`)}</dt>
              <dd>
                <span className={styles.value}>{fact.value}</span>
                {fact.hint && <span className={styles.hint}>· {fact.hint}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className={styles.actions} data-reveal>
        {site.url && (
          <a className="btn" href={site.url} target="_blank" rel="noopener noreferrer">
            {t('modal.visit')} <span aria-hidden="true">↗</span>
          </a>
        )}
        <SaveButton site={site} withLabel />
        <CompareButton site={site} withLabel />
        <Link className={`link ${styles.pageLink}`} to={`/site/${site.domain}`}>
          {t('modal.openPage')}
        </Link>
      </div>
    </div>
  );
}
