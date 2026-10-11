/**
 * SEO metadata shared by the app (runtime <head> updates) and by the build
 * (vite.config.js writes a static HTML file per route, plus sitemap.xml and
 * robots.txt). Plain JS with no JSX/imports, so Node can load it at build time.
 *
 * The public origin comes from VITE_SITE_URL at build time (see .env.example).
 */

export const SITE_NAME = 'AI Finder';
export const DEFAULT_SITE_URL = 'https://ws-58.ws.semalt.dev';
export const OG_IMAGE = 'og-image.png'; // public/og-image.png, 1200×630
export const OG_IMAGE_ALT = 'AI Finder — a catalogue of AI websites built on the FreeSerp API';

/** Open Graph locale per UI language. */
export const OG_LOCALES = { en: 'en_GB', uk: 'uk_UA' };

/**
 * Indexable routes. `file` is the static HTML written by the build for that URL
 * (nginx / .htaccess map `/new` → `new.html`). `type` is the schema.org page type.
 */
export const ROUTES = [
  {
    path: '/',
    file: 'index.html',
    type: 'CollectionPage',
    changefreq: 'daily',
    priority: '1.0',
    en: {
      title: 'AI Finder — a catalogue of AI tools and websites',
      description:
        'Search and filter AI websites by what they actually do: chatbots, image and video generation, voice, code, agents and more. Live data from the FreeSerp index.',
    },
    uk: {
      title: 'AI Finder — каталог ШІ-інструментів і сайтів',
      description:
        'Шукайте й фільтруйте ШІ-сайти за тим, що вони справді вміють: чат-боти, генерація зображень і відео, голос, код, агенти. Живі дані з індексу FreeSerp.',
    },
  },
  {
    path: '/new',
    file: 'new.html',
    type: 'CollectionPage',
    changefreq: 'daily',
    priority: '0.8',
    en: {
      title: 'New AI tools — the latest AI launches · AI Finder',
      description:
        'The most recently launched AI websites, grouped by launch date, with Domain Rating, category and builder signals. Updated from the FreeSerp index.',
    },
    uk: {
      title: 'Нові ШІ-інструменти — останні запуски · AI Finder',
      description:
        'Найсвіжіші ШІ-сайти, згруповані за датою запуску, з рейтингом домену, категоріями та технологіями. Дані з індексу FreeSerp.',
    },
  },
  {
    path: '/about',
    file: 'about.html',
    type: 'AboutPage',
    changefreq: 'monthly',
    priority: '0.5',
    en: {
      title: 'About AI Finder — data from the FreeSerp API',
      description:
        'What AI Finder is, who it is for and where the data comes from: the free, keyless FreeSerp API and its index of website homepages.',
    },
    uk: {
      title: 'Про AI Finder — дані з FreeSerp API',
      description:
        'Що таке AI Finder, для кого він і звідки дані: безкоштовний FreeSerp API без ключа та його індекс головних сторінок сайтів.',
    },
  },
  // personal pages (localStorage, shareable compare links): real pages, but not for search results
  {
    path: '/favorites',
    file: 'favorites.html',
    type: 'WebPage',
    noindex: true,
    en: {
      title: 'Saved AI sites · AI Finder',
      description: 'The AI websites you saved in this browser.',
    },
    uk: {
      title: 'Збережені ШІ-сайти · AI Finder',
      description: 'ШІ-сайти, які ви зберегли в цьому браузері.',
    },
  },
  {
    path: '/compare',
    file: 'compare.html',
    type: 'WebPage',
    noindex: true,
    en: {
      title: 'Compare AI sites · AI Finder',
      description: 'Domain Rating, launch dates, categories and technology of AI websites side by side.',
    },
    uk: {
      title: 'Порівняння ШІ-сайтів · AI Finder',
      description: 'Рейтинг домену, дати запуску, категорії й технології ШІ-сайтів поруч.',
    },
  },
];

/**
 * Shell for /site/<domain>. On PHP hosting public/site.php fills in the real
 * title, description, canonical and a pre-rendered profile; elsewhere the app
 * sets them once the site has loaded (see useSiteSeo).
 */
export const SITE_TEMPLATE = {
  path: null,
  file: 'site.html',
  type: 'WebPage',
  en: {
    title: 'AI site profile · AI Finder',
    description: 'Summary, AI categories, Domain Rating and launch date of an AI website, from the FreeSerp index.',
  },
  uk: {
    title: 'Профіль ШІ-сайту · AI Finder',
    description: 'Опис, ШІ-категорії, рейтинг домену й дата запуску ШІ-сайту з індексу FreeSerp.',
  },
};

/** Not indexed (robots noindex); served by the server with a real 404 status. */
export const NOT_FOUND = {
  path: null,
  file: '404.html',
  type: 'WebPage',
  noindex: true,
  en: {
    title: 'Page not found · AI Finder',
    description: 'This page is not in the AI Finder index.',
  },
  uk: {
    title: 'Сторінку не знайдено · AI Finder',
    description: 'Такої сторінки немає в індексі AI Finder.',
  },
};

export function findRoute(pathname) {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return ROUTES.find((r) => r.path === clean) ?? NOT_FOUND;
}

/** Absolute URL for a route path, e.g. ('https://x.dev', '/', '/new') → 'https://x.dev/new'. */
export function absoluteUrl(siteUrl, base, path) {
  const root = siteUrl.replace(/\/+$/, '') + (base || '/').replace(/\/+$/, '');
  return path === '/' ? `${root}/` : `${root}${path}`;
}

/** Short plain description (≤ 160 chars, cut on a word) for meta tags. */
export function clip(text, max = 160) {
  if (!text) return '';
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : cut.length)}…`;
}

/** Meta for /site/<domain>: { title, description, path } from a loaded site and its display name. */
export function siteMeta(site, name, lang) {
  const fallback =
    lang === 'uk'
      ? `${name}: опис, ШІ-категорії, рейтинг домену й дата запуску в каталозі AI Finder.`
      : `${name}: summary, AI categories, Domain Rating and launch date in the AI Finder catalogue.`;
  return {
    path: `/site/${site.domain}`,
    title: `${name} (${site.domain}) · ${SITE_NAME}`,
    description: clip(site.summary) || fallback,
  };
}

/** schema.org JSON-LD for a page (WebSite with search + the page itself). */
export function jsonLd({ siteUrl, base, route, lang }) {
  const home = absoluteUrl(siteUrl, base, '/');
  const meta = route[lang] ?? route.en;
  const graph = [
    {
      '@type': 'WebSite',
      '@id': `${home}#website`,
      url: home,
      name: SITE_NAME,
      inLanguage: ['en', 'uk'],
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${home}?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
  ];
  if (route.path) {
    graph.push({
      '@type': route.type,
      '@id': `${absoluteUrl(siteUrl, base, route.path)}#webpage`,
      url: absoluteUrl(siteUrl, base, route.path),
      name: meta.title,
      description: meta.description,
      isPartOf: { '@id': `${home}#website` },
      inLanguage: lang,
      ...(route.about ? { about: route.about } : {}),
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}
