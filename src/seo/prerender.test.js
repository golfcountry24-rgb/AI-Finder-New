import { describe, expect, it } from 'vitest';
import { renderList } from './prerender';

const list = {
  total: 1234,
  sites: [
    { domain: 'a.com', title: 'Alpha | a.com', summary: 'Does <things>', categories: ['Video Generation'], dr: 40, wentLive: '2026-08-13' },
  ],
};

describe('renderList', () => {
  it('writes plain HTML with links to the site pages and escapes API text', () => {
    const html = renderList({ heading: 'AI Finder', intro: 'Intro', list, base: '/' });
    expect(html).toContain('<div class="prerender">');
    expect(html).toContain('<a href="/site/a.com">Alpha</a>');
    expect(html).toContain('Does &lt;things&gt;');
    expect(html).toContain('Domain Rating 40');
    expect(html).toContain('13 Aug 2026');
    expect(html).not.toContain('<things>');
  });

  it('respects a sub-folder base', () => {
    expect(renderList({ heading: 'h', intro: 'i', list, base: '/ai-finder/' })).toContain('href="/ai-finder/site/a.com"');
  });
});
