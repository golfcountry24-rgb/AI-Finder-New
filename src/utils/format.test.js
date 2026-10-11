import { describe, expect, it } from 'vitest';
import { daysAgo, formatAiSource, getDisplayName } from './format';

describe('getDisplayName', () => {
  it('prefers the title part that matches the domain', () => {
    expect(getDisplayName({ title: 'Trusted Research Since 1807 | Wiley', domain: 'wiley.com' })).toBe('Wiley');
  });
  it('falls back to the first title part', () => {
    expect(getDisplayName({ title: 'Agent Luci — your AI assistant', domain: 'agentluci.com' })).toBe('Agent Luci');
  });
  it('uses the domain when there is no title', () => {
    expect(getDisplayName({ title: null, domain: 'example.com' })).toBe('example.com');
  });
});

describe('formatAiSource', () => {
  it('labels known builders and hides "not_ai"', () => {
    expect(formatAiSource('nextjs')).toBe('Next.js');
    expect(formatAiSource('not_ai')).toBeNull();
    expect(formatAiSource(null)).toBeNull();
    expect(formatAiSource('ai_likely', (k) => `t:${k}`)).toBe('t:builder.ai_likely');
  });
});

describe('daysAgo', () => {
  it('returns whole days and null for bad input', () => {
    const tenDays = new Date(Date.now() - 10 * 86_400_000).toISOString();
    expect(daysAgo(tenDays)).toBe(10);
    expect(daysAgo('nonsense')).toBeNull();
    expect(daysAgo(null)).toBeNull();
  });
});
