/**
 * Favicon URLs. Icons are loaded through a same-origin proxy that answers
 * "204 No Content" when a site has no icon, so missing icons never produce
 * red 404 errors in the browser console (the UI falls back to a monogram).
 *
 *  - default / FTP hosting: public/api/favicon.php
 *  - npm run dev / preview: handled by the favicon plugin in vite.config.js
 *  - Cloudflare Worker variant: `<VITE_API_BASE>?favicon=<domain>`
 */
const API_BASE = import.meta.env.VITE_API_BASE;

export function faviconUrl(domain) {
  if (!domain) return null;
  const d = encodeURIComponent(domain);
  return API_BASE ? `${API_BASE}?favicon=${d}` : `${import.meta.env.BASE_URL}api/favicon.php?d=${d}`;
}
