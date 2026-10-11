import { useEffect, useLayoutEffect } from 'react';
import { prefersReducedMotion, revealUp } from './index';

/**
 * Slides up every `[data-reveal]` element inside `rootRef` once, on mount
 * (or when `deps` change). Elements are taken in DOM order and staggered.
 */
export function useRevealUp(rootRef, deps = [], options) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    return revealUp([...root.querySelectorAll('[data-reveal]')], options);
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

const LIST_REVEAL = { distance: 36, step: 90 };

/**
 * For lists that grow ("Load more") or get replaced (filters): every item
 * that hasn't been shown yet slides up from below at the moment it scrolls
 * into view. Items entering together (one grid row) are staggered.
 */
export function useListReveal(containerRef, trigger, selector = '[data-item]') {
  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root) return undefined;
    const fresh = [...root.querySelectorAll(`${selector}:not([data-shown])`)];
    if (fresh.length === 0 || prefersReducedMotion()) return undefined;
    fresh.forEach((el) => el.setAttribute('data-shown', ''));
    if (typeof IntersectionObserver === 'undefined') return revealUp(fresh, LIST_REVEAL);

    // hidden before the first paint, below their final position
    fresh.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = `translateY(${LIST_REVEAL.distance}px) scale(0.985)`;
    });

    const pending = new Set(fresh);
    const cleanups = [];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting && pending.has(e.target))
          .map((e) => e.target)
          .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
        if (visible.length === 0) return;
        visible.forEach((el) => {
          observer.unobserve(el);
          pending.delete(el);
        });
        cleanups.push(revealUp(visible, LIST_REVEAL));
      },
      { rootMargin: '0px 0px -6% 0px' },
    );
    fresh.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      cleanups.forEach((fn) => fn());
      // never-revealed items get another chance on the next run (StrictMode, re-renders)
      pending.forEach((el) => {
        el.removeAttribute('data-shown');
        el.style.removeProperty('opacity');
        el.style.removeProperty('transform');
      });
    };
  }, [trigger]); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Slides `[data-reveal-scroll]` elements up when they enter the viewport.
 * Elements already on screen animate immediately.
 */
export function useScrollReveal(rootRef, deps = []) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return undefined;

    const targets = [...root.querySelectorAll('[data-reveal-scroll]')];
    const cleanups = [];
    const pending = new Set(targets);
    targets.forEach((el) => {
      el.style.opacity = '0';
    });

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).map((e) => e.target);
        visible.forEach((el) => {
          observer.unobserve(el);
          pending.delete(el);
        });
        if (visible.length) cleanups.push(revealUp(visible, { distance: 28 }));
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    targets.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      cleanups.forEach((fn) => fn());
      pending.forEach((el) => el.style.removeProperty('opacity'));
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}
