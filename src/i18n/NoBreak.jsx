import { Fragment } from 'react';

/**
 * Keeps hyphenated compounds ("ШІ-інструменти", "AI-related") on one line,
 * so headlines never break right after a hyphen.
 */
export function NoBreak({ children }) {
  if (typeof children !== 'string') return children;
  return children.split(/(\S*\S-\S+)/).map((part, i) =>
    /\S-\S/.test(part) ? (
      <span key={i} style={{ whiteSpace: 'nowrap' }}>
        {part}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
