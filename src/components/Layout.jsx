import { useLayoutEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { CompareTray } from './CompareTray';
import { useI18n } from '../i18n';
import { useSeo } from '../seo/useSeo';

export function Layout() {
  const { pathname } = useLocation();
  const mainRef = useRef(null);
  const { t, lang } = useI18n();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // title, description, canonical, Open Graph and JSON-LD for the current route
  // /site/<domain> sets its own tags once the site has loaded (useSiteSeo)
  useSeo(pathname.startsWith('/site/') ? null : pathname, lang);

  return (
    <>
      {/* focus <main> directly so keyboard users land on the content, not just scroll there */}
      <a
        href="#main"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          mainRef.current?.focus();
        }}
      >
        {t('common.skip')}
      </a>
      <Header />
      <main ref={mainRef} id="main" tabIndex={-1} style={{ outline: 'none' }}>
        <Outlet />
      </main>
      <Footer />
      <CompareTray />
    </>
  );
}
