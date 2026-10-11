/**
 * Builds the SEO part of <head> as an HTML string. Used at build time to write
 * one static HTML file per route; the app later keeps the same tags in sync
 * on client-side navigation and language switches (see useSeo.js).
 */
import { OG_IMAGE, OG_IMAGE_ALT, OG_LOCALES, SITE_NAME, absoluteUrl, jsonLd } from './config.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function headTags({ siteUrl, base, route, lang = 'en' }) {
  const meta = route[lang] ?? route.en;
  const url = route.path ? absoluteUrl(siteUrl, base, route.path) : null;
  const image = absoluteUrl(siteUrl, base, '/') + OG_IMAGE;
  const other = lang === 'en' ? 'uk' : 'en';
  const lines = [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<meta name="robots" content="${route.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}" />`,
    url && `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    url && `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:locale" content="${OG_LOCALES[lang]}" />`,
    `<meta property="og:locale:alternate" content="${OG_LOCALES[other]}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(OG_IMAGE_ALT)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    // "<" escaped so the JSON can never close the script tag early
    `<script type="application/ld+json" id="ld-json">${JSON.stringify(
      jsonLd({ siteUrl, base, route, lang }),
    ).replace(/</g, '\\u003c')}</script>`,
  ];
  return lines.filter(Boolean).join('\n    ');
}
