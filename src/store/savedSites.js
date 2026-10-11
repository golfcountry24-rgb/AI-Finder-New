import { useCallback, useMemo, useSyncExternalStore } from 'react';

/**
 * Lists of sites kept in this browser (localStorage), shared by every component
 * through useSyncExternalStore and kept in sync across open tabs ('storage' event).
 *
 *  - favorites: snapshots of saved sites, so the Saved page renders without the API;
 *  - compare:   up to COMPARE_MAX sites picked for the comparison table.
 *
 * Only plain normalised Site fields are stored (see src/types/api.ts) plus `savedAt`.
 */
export const COMPARE_MAX = 4;
const FAVORITES_MAX = 200;

const SITE_FIELDS = [
  'domain',
  'url',
  'title',
  'summary',
  'categories',
  'dr',
  'wentLive',
  'firstSeen',
  'fetchedAt',
  'aiSource',
  'tld',
  'webserver',
  'httpStatus',
];

function snapshot(site) {
  const out = {};
  SITE_FIELDS.forEach((key) => {
    out[key] = site[key] ?? (key === 'categories' ? [] : null);
  });
  out.savedAt = new Date().toISOString();
  return out;
}

function createListStore(storageKey, max) {
  const listeners = new Set();
  let items = read();

  function read() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]');
      return Array.isArray(parsed) ? parsed.filter((s) => s && typeof s.domain === 'string').slice(0, max) : [];
    } catch {
      return [];
    }
  }

  function commit(next) {
    items = next;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* storage full or blocked: the list still works until the tab closes */
    }
    listeners.forEach((fn) => fn());
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key !== storageKey) return;
      items = read();
      listeners.forEach((fn) => fn());
    });
  }

  return {
    max,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    getSnapshot: () => items,
    has: (domain) => items.some((s) => s.domain === domain),
    /** Adds or removes a site. Returns false when the list is full and nothing changed. */
    toggle(site) {
      if (items.some((s) => s.domain === site.domain)) {
        commit(items.filter((s) => s.domain !== site.domain));
        return true;
      }
      if (items.length >= max) return false;
      commit([...items, snapshot(site)]);
      return true;
    },
    remove: (domain) => commit(items.filter((s) => s.domain !== domain)),
    clear: () => commit([]),
  };
}

export const favoritesStore = createListStore('ai-finder-favorites', FAVORITES_MAX);
export const compareStore = createListStore('ai-finder-compare', COMPARE_MAX);

function useList(store) {
  const items = useSyncExternalStore(store.subscribe, store.getSnapshot, () => []);
  const has = useCallback((domain) => items.some((s) => s.domain === domain), [items]);
  return useMemo(
    () => ({
      items,
      count: items.length,
      full: items.length >= store.max,
      max: store.max,
      has,
      toggle: store.toggle,
      remove: store.remove,
      clear: store.clear,
    }),
    [items, has, store],
  );
}

export const useFavorites = () => useList(favoritesStore);
export const useCompare = () => useList(compareStore);

/** /compare?d=a.com,b.com — the shareable address of a comparison. */
export function compareHref(domains) {
  return `/compare?d=${domains.map(encodeURIComponent).join(',')}`;
}
