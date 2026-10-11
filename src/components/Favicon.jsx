import { useState } from 'react';
import { faviconUrl } from '../services/favicon';
import styles from './Favicon.module.css';

/** Soft tints for the letter tile; the same domain always gets the same one. */
const TINTS = ['#3ee0a0', '#bfd7ff', '#ffd58a', '#f7b8c8', '#d9c8ff', '#9fe6f2'];

function tintFor(domain) {
  let hash = 0;
  for (const ch of domain ?? '') hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return TINTS[hash % TINTS.length];
}

/**
 * Site favicon (DuckDuckGo's icon service via our same-origin proxy, see services/favicon.js).
 * The domain monogram is always rendered underneath, so the tile never looks
 * empty while the icon is loading; the icon fades in on top once it arrives.
 */
export function Favicon({ domain, size = 'md' }) {
  const [status, setStatus] = useState(domain ? 'loading' : 'failed');
  const letter = (domain ?? '?').replace(/^www\./, '').charAt(0).toUpperCase();

  return (
    <span
      className={`${styles.box} ${styles[size]} ${status === 'loaded' ? styles.loaded : ''}`}
      style={{ '--tint': tintFor(domain) }}
      aria-hidden="true"
    >
      {status !== 'loaded' && <span className={styles.letter}>{letter}</span>}
      {status !== 'failed' && (
        <img
          src={faviconUrl(domain)}
          alt=""
          loading="lazy"
          decoding="async"
          className={status === 'loaded' ? styles.shown : undefined}
          onError={() => setStatus('failed')}
          onLoad={(e) => {
            // a 204 (no icon) fires onError; tiny placeholders count as missing too
            setStatus(e.currentTarget.naturalWidth < 8 ? 'failed' : 'loaded');
          }}
        />
      )}
    </span>
  );
}
