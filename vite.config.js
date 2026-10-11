import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { DEFAULT_SITE_URL, NOT_FOUND, ROUTES, SITE_TEMPLATE, absoluteUrl } from './src/seo/config.js';
import { PRERENDER_LISTS, fetchList, renderList } from './src/seo/prerender.js';
import { headTags } from './src/seo/head.js';

/**
 * In production the browser calls the same-origin PHP proxies in public/api/
 * (freeserp.php for data, favicon.php for site icons). Node has no PHP, so during
 * `npm run dev` and `npm run preview` the same paths are served here.
 */
const freeserpProxy = {
  '/api/freeserp.php': {
    target: 'https://freeserp.ai',
    changeOrigin: true,
    secure: true,
    rewrite: (path) => path.replace(/^\/api\/freeserp\.php/, '/api.php'),
  },
};

/** Dev/preview twin of public/api/favicon.php: icon when it exists, 204 when it doesn't. */
const HOSTNAME = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

function faviconMiddleware() {
  const cache = new Map();
  return async (req, res, next) => {
    if (!req.url?.startsWith('/api/favicon.php')) return next();
    const noIcon = () => {
      res.statusCode = 204;
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.end();
    };
    const domain = (new URL(req.url, 'http://local').searchParams.get('d') || '').toLowerCase();
    if (!HOSTNAME.test(domain)) return noIcon();
    try {
      let icon = cache.get(domain);
      if (icon === undefined) {
        const upstream = await fetch(`https://icons.duckduckgo.com/ip3/${domain}.ico`, {
          signal: AbortSignal.timeout(8000),
        });
        const type = upstream.headers.get('content-type') || '';
        const body = Buffer.from(await upstream.arrayBuffer());
        icon = upstream.ok && type.includes('image') && body.length >= 32 ? { type, body } : null;
        cache.set(domain, icon);
      }
      if (!icon) return noIcon();
      res.setHeader('Content-Type', icon.type);
      res.setHeader('Cache-Control', 'public, max-age=604800');
      res.end(icon.body);
    } catch {
      noIcon();
    }
  };
}

const faviconPlugin = {
  name: 'ai-finder-favicon-proxy',
  configureServer(server) {
    server.middlewares.use(faviconMiddleware());
  },
  configurePreviewServer(server) {
    server.middlewares.use(faviconMiddleware());
  },
};

/**
 * SEO at build time:
 *  - one static HTML file per route (index.html, new.html, about.html, favorites.html,
 *    compare.html, site.html, 404.html), each with its own <title>, description,
 *    canonical, Open Graph and JSON-LD between <!--seo:start--> and <!--seo:end-->
 *    (public/site.php swaps that block for the real site on /site/<domain>);
 *  - the current catalogue lists pre-rendered as plain HTML into index.html and
 *    new.html (src/seo/prerender.js), so crawlers that don't run JS see the content;
 *  - sitemap.xml (indexable pages + the pre-rendered /site/<domain> profiles) and robots.txt.
 * In dev the home page tags are injected so the head looks the same.
 */
function seoPlugin({ siteUrl, base, prerender, prerenderApi }) {
  const MARK = '<!--seo-head-->';
  const wrap = (tags) => `<!--seo:start-->\n    ${tags}\n    <!--seo:end-->`;
  let isBuild = false;
  return {
    name: 'ai-finder-seo',
    enforce: 'post', // after Vite has produced index.html
    configResolved(config) {
      isBuild = config.command === 'build';
    },
    transformIndexHtml(html) {
      // dev: fill in the home page; build: keep the marker for generateBundle
      return isBuild ? html : html.replace(MARK, wrap(headTags({ siteUrl, base, route: ROUTES[0] })));
    },
    async generateBundle(_, bundle) {
      const index = bundle['index.html'];
      if (!index) return;
      const template = String(index.source);

      // the catalogue lists as plain HTML (skipped quietly when the API can't be reached)
      const lists = {};
      if (prerender) {
        await Promise.all(
          Object.entries(PRERENDER_LISTS).map(async ([file, params]) => {
            try {
              lists[file] = await fetchList(prerenderApi, params);
            } catch (error) {
              this.warn(`pre-render of ${file} skipped: ${error.message}`);
            }
          }),
        );
      }

      for (const route of [...ROUTES, NOT_FOUND, SITE_TEMPLATE]) {
        let html = template.replace(MARK, wrap(headTags({ siteUrl, base, route })));
        const list = lists[route.file];
        if (list?.sites.length) {
          html = html.replace(
            '<div id="root"></div>',
            `<div id="root">${renderList({ heading: route.en.title, intro: route.en.description, list, base })}</div>`,
          );
        }
        if (route.file === 'index.html') index.source = html;
        else this.emitFile({ type: 'asset', fileName: route.file, source: html });
      }

      const today = new Date().toISOString().slice(0, 10);
      const entry = (path, changefreq, priority) =>
        `  <url>\n    <loc>${absoluteUrl(siteUrl, base, path)}</loc>\n    <lastmod>${today}</lastmod>\n` +
        `    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
      const profiles = [...new Set(Object.values(lists).flatMap((l) => l.sites.map((s) => s.domain)))];
      const urls = [
        ...ROUTES.filter((r) => !r.noindex).map((r) => entry(r.path, r.changefreq, r.priority)),
        ...profiles.map((domain) => entry(`/site/${domain}`, 'weekly', '0.6')),
      ].join('\n');
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      });
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\nDisallow: ${base}api/\n\nSitemap: ${absoluteUrl(siteUrl, base, '/')}sitemap.xml\n`,
      });
    },
  };
}

/**
 * /site/<domain> in dev and preview. A domain has a dot, so Vite would take it for a
 * file and answer 404; the request is served the app (dev) or the built site.html
 * (preview) instead. On real hosting site.php does this (public/.htaccess, nginx).
 */
function siteRoutePlugin(base) {
  const prefix = `${base}site/`;
  const rewrite = (target) => (req, _res, next) => {
    const path = req.url?.split('?')[0] ?? '';
    if (path.startsWith(prefix) && !path.slice(prefix.length).includes('/')) req.url = target;
    next();
  };
  return {
    name: 'ai-finder-site-route',
    configureServer(server) {
      server.middlewares.use(rewrite(base));
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite(`${base}site.html`));
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  // public origin for canonical / Open Graph / sitemap (no trailing slash)
  const siteUrl = (env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '');
  // '/' for a domain root; e.g. VITE_BASE=/ai-finder/ for a sub-folder
  const base = env.VITE_BASE || '/';
  // build-time pre-render of the catalogue lists (PRERENDER=0 turns it off, e.g. offline builds)
  const prerender = (process.env.PRERENDER ?? env.VITE_PRERENDER) !== '0';
  const prerenderApi = process.env.PRERENDER_API || 'https://freeserp.ai/api.php';

  return {
    base,
    define: { 'import.meta.env.VITE_SITE_URL': JSON.stringify(siteUrl) },
    plugins: [react(), faviconPlugin, siteRoutePlugin(base), seoPlugin({ siteUrl, base, prerender, prerenderApi })],
    server: { proxy: freeserpProxy },
    preview: { proxy: freeserpProxy },
    test: {
      include: ['src/**/*.test.{js,jsx}'],
      environment: 'node', // hook/component tests switch to jsdom per file
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
    },
  };
});
