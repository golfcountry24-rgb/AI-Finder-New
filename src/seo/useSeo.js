import { useEffect } from 'react';
import { OG_LOCALES, NOT_FOUND, absoluteUrl, findRoute, jsonLd, siteMeta } from './config.js';
import { getDisplayName } from '../utils/format';

const SITE_URL = import.meta.env.VITE_SITE_URL;
const BASE = import.meta.env.BASE_URL;

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!href) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Keeps <head> in sync with the current route and UI language on client-side
 * navigation. The first load already has the right tags in the static HTML
 * written by the build, so this only matters after navigation or a language switch.
 * Filtered Explore URLs (?q=, ?cat=) keep the canonical of the plain page.
 */
export function useSeo(pathname, lang) {
  useEffect(() => {
    if (pathname === null) return; // the page sets its own tags (useSiteSeo)
    applyRoute(findRoute(pathname), lang);
  }, [pathname, lang]);
}

/**
 * Tags for /site/<domain>: the site's own title and description once it has
 * loaded, noindex when the domain isn't in the index.
 */
export function useSiteSeo({ status, site }, lang) {
  useEffect(() => {
    if (status === 'notfound' || status === 'error') {
      applyRoute(NOT_FOUND, lang);
      return;
    }
    if (status !== 'success') return;
    const name = getDisplayName(site);
    const meta = siteMeta(site, name, lang);
    applyRoute(
      {
        path: meta.path,
        type: 'WebPage',
        [lang]: { title: meta.title, description: meta.description },
        about: { '@type': 'WebSite', name, url: site.url ?? `https://${site.domain}` },
      },
      lang,
    );
  }, [status, site, lang]);
}

function applyRoute(route, lang) {
  const meta = route[lang] ?? route.en;
  const url = route.path ? absoluteUrl(SITE_URL, BASE, route.path) : null;

  document.title = meta.title;
  setMeta('name', 'description', meta.description);
  setMeta('name', 'robots', route.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large');
  setCanonical(url);
  setMeta('property', 'og:title', meta.title);
  setMeta('property', 'og:description', meta.description);
  if (url) setMeta('property', 'og:url', url);
  setMeta('property', 'og:locale', OG_LOCALES[lang]);
  setMeta('property', 'og:locale:alternate', OG_LOCALES[lang === 'en' ? 'uk' : 'en']);
  setMeta('name', 'twitter:title', meta.title);
  setMeta('name', 'twitter:description', meta.description);

  const ld = document.getElementById('ld-json');
  if (ld) ld.textContent = JSON.stringify(jsonLd({ siteUrl: SITE_URL, base: BASE, route, lang }));
}
