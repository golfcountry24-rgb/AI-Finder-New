/**
 * Motion layer (Anime.js v4).
 *
 * One movement for the whole app: content slides up from below and fades in.
 *  - elements are hidden synchronously before the first paint (no flash);
 *  - the animation waits for web fonts (max 700 ms), so text never reflows mid-motion;
 *  - only transform + opacity are animated, inline styles are removed afterwards
 *    (CSS hovers keep working);
 *  - safe under React StrictMode: a cancelled run restores the element instantly;
 *  - `prefers-reduced-motion: reduce` disables everything.
 */
import { animate, stagger } from 'animejs';

export const MOTION = {
  distance: 28, // px the content travels upwards
  scale: 0.985, // and grows into place from just below full size
  duration: 800,
  stagger: 70,
  maxDelay: 560, // long lists don't wait in a long queue
  ease: 'outQuart',
};

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

let fontsPromise;
/** Resolves when web fonts are ready, or after a short timeout. */
export function fontsReady() {
  if (!fontsPromise) {
    const fonts = typeof document !== 'undefined' ? document.fonts : null;
    // load every family (Latin + Cyrillic subsets) up front — the mono face is
    // otherwise requested only when cards render
    const ready = fonts?.load
      ? Promise.all([
          fonts.load('400 1em "Onest Variable"', 'Aa Аа Іі'),
          fonts.load('600 1em "Onest Variable"', 'Aa Аа Іі'),
          fonts.load('450 1em "Geist Mono Variable"', 'Aa Аа Іі'),
          fonts.load('600 1em "Unbounded Variable"', 'Aa Аа Іі'),
        ]).catch(() => {})
      : Promise.resolve();
    fontsPromise = Promise.race([ready, new Promise((resolve) => setTimeout(resolve, 700))]);
  }
  return fontsPromise;
}

/**
 * Slide elements up into place. Call it during layout (before paint).
 * Returns a cleanup function that cancels the animation and restores the elements.
 */
export function revealUp(targets, options = {}) {
  const list = (Array.isArray(targets) ? targets : [...(targets?.length !== undefined ? targets : [targets])]).filter(Boolean);
  if (list.length === 0 || prefersReducedMotion()) return () => {};

  const {
    distance = MOTION.distance,
    scale = MOTION.scale,
    duration = MOTION.duration,
    step = MOTION.stagger,
    delay = 0,
  } = options;

  const restore = () =>
    list.forEach((el) => {
      el.style.removeProperty('opacity');
      el.style.removeProperty('transform');
    });

  // hidden before the first paint — nothing flashes in its final position
  list.forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = `translateY(${distance}px) scale(${scale})`;
  });

  let animation = null;
  let cancelled = false;

  fontsReady().then(() => {
    if (cancelled) return;
    animation = animate(list, {
      opacity: [0, 1],
      translateY: [distance, 0],
      scale: [scale, 1],
      duration,
      ease: MOTION.ease,
      delay: stagger(step, { start: delay, modifier: (v) => Math.min(v, delay + MOTION.maxDelay) }),
      // drop the inline styles at the end so CSS (hover transforms etc.) takes over again
      onComplete: restore,
    });
  });

  return () => {
    cancelled = true;
    animation?.cancel();
    restore();
  };
}
