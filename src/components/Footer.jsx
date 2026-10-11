import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { useI18n } from '../i18n';
import styles from './Footer.module.css';

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className={styles.footer}>
      <div className={styles.panel}>
        <div className={styles.inner}>
          <div className={styles.brand}>
            <Logo inverted />
            <p className={styles.tagline}>{t('footer.tagline')}</p>
          </div>

          <nav className={styles.col} aria-label={t('footer.browse')}>
            <span className={styles.heading}>{t('footer.browse')}</span>
            <Link to="/">{t('nav.explore')}</Link>
            <Link to="/new">{t('nav.new')}</Link>
            <Link to="/about">{t('nav.about')}</Link>
          </nav>

          <div className={styles.col}>
            <span className={styles.heading}>{t('footer.data')}</span>
            <a href="https://freeserp.ai" target="_blank" rel="noreferrer">
              FreeSerp.ai ↗
            </a>
            <a href="https://freeserp.ai/docs.php" target="_blank" rel="noreferrer">
              {t('footer.docs')}
            </a>
          </div>
        </div>
        <div className={styles.bottom}>
          <span>{t('footer.copyright', { year: new Date().getFullYear() })}</span>
          <span>{t('footer.source')}</span>
        </div>
      </div>
    </footer>
  );
}
