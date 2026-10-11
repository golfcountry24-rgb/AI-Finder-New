import { useEffect, useState } from 'react';
import { searchSites } from '../services/freeserp';

/**
 * The newest genuine AI products by launch date (went_live, newest first).
 * Same request the New AI page makes, just a short page of it.
 */
export function useRecentLaunches(size = 12) {
  const [state, setState] = useState({ status: 'loading', items: [] });

  useEffect(() => {
    const controller = new AbortController();
    searchSites({ sort: 'went_live', order: 'desc', aiStartups: true, size }, controller.signal)
      .then((data) => setState({ status: 'success', items: data.results }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ status: 'error', items: [] });
      });
    return () => controller.abort();
  }, [size]);

  return state;
}
