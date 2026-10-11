import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MAX_OFFSET, searchSites } from '../services/freeserp';

const initialState = {
  requestId: null, // which params (+ retry attempt) these results belong to
  items: [],
  offset: 0, // next `from` value (kept separately because of de-duplication)
  total: 0,
  status: 'loading', // 'loading' | 'success' | 'error'
  error: null,
  loadingMore: false,
  loadMoreError: null,
};

/**
 * Fetches a paginated list of AI sites for the given query params.
 *
 * - When params change, the previous results stay visible with `refreshing: true`
 *   until the new ones arrive, so the page doesn't collapse into skeletons on every
 *   filter click. Only the very first load (or a load after an error) shows
 *   `status: 'loading'`. This is derived during render — no extra state updates.
 * - "Load more" can't run twice at once (a double click used to skip a page).
 * - Older requests are cancelled when params change or the component unmounts.
 *
 * @param {object} params  options accepted by searchSites (without from)
 */
export function useSites(params) {
  const [state, setState] = useState(initialState);
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify(params);
  const requestId = `${key}#${attempt}`;
  const size = params.size ?? 24;

  const controllerRef = useRef(null);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current?.abort();
    controllerRef.current = controller;
    loadingMoreRef.current = false;

    searchSites({ ...JSON.parse(key), from: 0 }, controller.signal)
      .then((data) =>
        setState({
          ...initialState,
          requestId,
          items: dedupe(data.results),
          offset: data.count,
          total: data.total,
          status: 'success',
        }),
      )
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setState({ ...initialState, requestId, status: 'error', error });
      });

    return () => controller.abort();
  }, [key, requestId]);

  // what the UI sees for the current params
  let view;
  if (state.requestId === requestId) view = { ...state, refreshing: false };
  else if (state.status === 'success' && state.items.length > 0)
    view = { ...state, refreshing: true, loadingMore: false, loadMoreError: null };
  else view = { ...initialState, refreshing: false };

  const viewRef = useRef(view);
  useLayoutEffect(() => {
    viewRef.current = view;
  });

  const loadMore = useCallback(() => {
    const current = viewRef.current;
    if (loadingMoreRef.current || current.status !== 'success' || current.refreshing) return;
    const from = current.offset;
    const pageSize = Math.min(size, MAX_OFFSET - from); // the index can't go past from + size = 10 000
    if (pageSize <= 0) return;

    loadingMoreRef.current = true;
    setState((prev) => ({ ...prev, loadingMore: true, loadMoreError: null }));
    const controller = controllerRef.current;

    searchSites({ ...JSON.parse(key), from, size: pageSize }, controller?.signal)
      .then((data) =>
        setState((prev) => ({
          ...prev,
          items: dedupe([...prev.items, ...data.results]),
          offset: from + data.count,
          total: data.total,
          loadingMore: false,
        })),
      )
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setState((prev) => ({ ...prev, loadingMore: false, loadMoreError: error }));
      })
      .finally(() => {
        if (controllerRef.current === controller) loadingMoreRef.current = false;
      });
  }, [key, size]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const hasMore =
    view.status === 'success' && !view.refreshing && view.offset < view.total && view.offset < MAX_OFFSET;

  return { ...view, hasMore, loadMore, retry };
}

function dedupe(list) {
  const seen = new Set();
  return list.filter((site) => {
    if (seen.has(site.domain)) return false;
    seen.add(site.domain);
    return true;
  });
}
