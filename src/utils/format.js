import { AI_SOURCE_LABELS } from './constants';

const SEPARATORS = /\s+[|–—·:-]\s+/;

/**
 * Derives a short display name from the page <title>.
 * Prefers the title segment that mentions the domain name
 * ("Trusted Research | Wiley" → "Wiley"), otherwise the first segment.
 * Falls back to the domain when there is no usable title.
 */
export function getDisplayName(site) {
  const { title, domain } = site;
  if (!title) return domain ?? '—';

  const segments = title
    .split(SEPARATORS)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2 && part.length <= 48);
  if (segments.length === 0) return domain ?? title;

  const stem = (domain ?? '').replace(/^www\./, '').split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const byDomain =
    stem.length >= 3 &&
    segments
      .filter((part) => part.toLowerCase().replace(/[^a-z0-9]/g, '').includes(stem))
      .sort((a, b) => a.length - b.length)[0];

  return byDomain || segments[0];
}

/**
 * Readable builder label for ai_source, or null for "not_ai"/unknown.
 * `t` translates the one non-brand value ("ai_likely").
 */
export function formatAiSource(source, t) {
  if (!source || source === 'not_ai') return null;
  const key = source.toLowerCase();
  if (key === 'ai_likely') return t ? t('builder.ai_likely') : 'Likely AI-built';
  return AI_SOURCE_LABELS[key] ?? source;
}

/** Days between an ISO date and today, or null. */
export function daysAgo(value) {
  if (!value) return null;
  const diff = Date.now() - new Date(value).getTime();
  if (Number.isNaN(diff)) return null;
  return Math.max(0, Math.floor(diff / 86_400_000));
}
