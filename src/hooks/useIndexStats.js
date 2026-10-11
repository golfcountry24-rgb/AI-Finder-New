import { useEffect, useState } from 'react';
import { searchSites } from '../services/freeserp';

/**
 * Real totals of the AI niche, taken from the `total` field of two
 * size=1 requests (all category=ai sites and genuine AI products only).
 */
export function useIndexStats() {
  const [stats, setStats] = useState({ all: null, startups: null });

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      searchSites({ size: 1, sort: 'dr' }, controller.signal),
      searchSites({ size: 1, sort: 'dr', aiStartups: true }, controller.signal),
    ])
      .then(([all, startups]) => setStats({ all: all.total, startups: startups.total }))
      .catch(() => {}); // decorative — the main list shows its own error state
    return () => controller.abort();
  }, []);

  return stats;
}
