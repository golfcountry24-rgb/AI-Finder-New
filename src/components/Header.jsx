import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { LangSwitch } from './LangSwitch';
import { ThemeSwitch } from './ThemeSwitch';
import { useFavorites } from '../store/savedSites';
import { useI18n } from '../i18n';
import styles from './Header.module.css';

const NAV = [
  { to: '/', key: 'nav.explore', end: true },
  { to: '/new', key: 'nav.new' },
  { to: '/about', key: 'nav.about' },
  { to: '/favorites', key: 'nav.saved', saved: true },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { t } = useI18n();
  const favorites = useFavorites();
  const headerRef = useRef(null);
  const toggleRef = useRef(null);

  // close the mobile menu on navigation (state adjusted during render, no effect needed)
  const [menuPath, setMenuPath] = useState(location.pathname);
  if (menuPath !== location.pathname) {
    setMenuPath(location.pathname);
    setOpen(false);
  }

  // the open mobile menu closes on Esc (focus back to the button) and on a click outside the header
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    const onPointer = (event) => {
      if (!headerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  // denser, less transparent bar once the page is scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header ref={headerRef} className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.wrap}`}>
        <div className={styles.inner}>
          <Logo compact />

          <nav id="main-nav" className={`${styles.nav} ${open ? styles.navOpen : ''}`} aria-label={t('nav.main')}>
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
              >
                {t(item.key)}
                {item.saved && favorites.count > 0 && (
                  <span className={styles.badge} aria-label={t('nav.savedCount', { count: favorites.count })}>
                    {favorites.count}
                  </span>
                )}
              </NavLink>
            ))}
            <a className={styles.api} href="https://freeserp.ai/docs.php" target="_blank" rel="noreferrer">
              <span className={styles.dot} aria-hidden="true" />
              {t('nav.apiDocs')}
              <span aria-hidden="true">↗</span>
              <span className="visually-hidden">{t('common.opensNewTab')}</span>
            </a>
          </nav>

          <div className={styles.actions}>
            <ThemeSwitch />
            <LangSwitch />
            <button
              ref={toggleRef}
              type="button"
              className={styles.toggle}
              aria-expanded={open}
              aria-controls="main-nav"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="visually-hidden">{open ? t('nav.closeMenu') : t('nav.openMenu')}</span>
              <span className={`${styles.burger} ${open ? styles.burgerOpen : ''}`} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
