/**
 * Test data for the e2e suite: a small, fixed slice of real FreeSerp records
 * (AI niche) and a fake /api.php that filters, sorts and pages them the way the
 * real index does for the parameters the app sends. Tests never hit the network.
 */
export const SITES = [
  {
    domain: 'sharethis.com',
    url: 'https://sharethis.com/',
    title: 'ShareThis | Share Buttons | Website Tools | Behavioral Intelligence',
    ai_summary:
      'ShareThis is a digital marketing platform providing social sharing tools and behavioral data solutions for websites.',
    ai_categories: ['Social Media'],
    ai_source: 'wordpress',
    dr: 73,
    went_live: '2026-08-13',
    first_seen: '2025-01-01',
    tld: 'com',
    webserver: 'CloudFront',
    http_status: 200,
    ai_startups: 0,
  },
  {
    domain: 'wiley.com',
    url: 'https://www.wiley.com/',
    title: 'Trusted Research and Education | Wiley',
    ai_summary: 'Wiley is a global research and publishing company with over 1,800 journals and AI guidance for researchers.',
    ai_categories: ['Research & Science', 'Knowledge & RAG'],
    ai_source: 'not_ai',
    dr: 73,
    went_live: '2026-08-13',
    first_seen: '2025-02-11',
    tld: 'com',
    webserver: 'Apache',
    http_status: 200,
    ai_startups: 0,
  },
  {
    domain: 'bing.com',
    url: 'https://www.bing.com/',
    title: 'Microsoft Bing',
    ai_summary: 'This is the Microsoft Bing search engine interface with a search box and a sign-in link.',
    ai_categories: ['AI Search & Answers'],
    ai_source: 'not_ai',
    dr: 72,
    went_live: '2026-08-07',
    first_seen: '2025-01-03',
    tld: 'com',
    webserver: 'Microsoft-IIS',
    http_status: 200,
    ai_startups: 1,
  },
  {
    domain: 'hcaptcha.com',
    url: 'https://www.hcaptcha.com/',
    title: 'hCaptcha - Bot detection and fraud prevention',
    ai_summary: 'hCaptcha provides real-time bot detection and fraud prevention with privacy-preserving machine learning.',
    ai_categories: ['Security & Moderation'],
    ai_source: 'nextjs',
    dr: 71,
    went_live: '2026-08-11',
    first_seen: '2025-03-20',
    tld: 'com',
    webserver: 'cloudflare',
    http_status: 200,
    ai_startups: 1,
  },
  {
    domain: 'plausible.io',
    url: 'https://plausible.io/',
    title: 'Plausible Analytics | Simple, privacy-friendly Google Analytics alternative',
    ai_summary: 'Plausible Analytics is an open-source, privacy-friendly web analytics tool hosted in the EU.',
    ai_categories: ['Data & Analytics'],
    ai_source: 'react',
    dr: 70,
    went_live: '2026-08-13',
    first_seen: '2025-04-02',
    tld: 'io',
    webserver: 'nginx',
    http_status: 200,
    ai_startups: 1,
  },
  {
    domain: 'typeform.com',
    url: 'https://www.typeform.com/',
    title: 'Typeform | People-Friendly Forms and Surveys',
    ai_summary: 'Typeform is a platform for forms, surveys and quizzes with AI-powered automated workflows.',
    ai_categories: ['AI Automation & Workflows', 'Data & Analytics'],
    ai_source: 'nextjs',
    dr: 69,
    went_live: '2026-08-12',
    first_seen: '2025-02-28',
    tld: 'com',
    webserver: 'cloudflare',
    http_status: 200,
    ai_startups: 1,
  },
  {
    domain: 'pagelyte.xyz',
    url: 'https://pagelyte.xyz/',
    title: 'Pagelyte — Web data for AI agents',
    ai_summary: 'Pagelyte is a developer-focused API that provides clean web data to power AI agents and large language models.',
    ai_categories: ['AI Agents & Autonomous', 'AI Infrastructure & API'],
    ai_source: 'ai_likely',
    dr: 4,
    went_live: '2026-09-08',
    first_seen: '2026-09-07',
    tld: 'xyz',
    webserver: 'Vercel',
    http_status: 200,
    ai_startups: 1,
  },
  {
    domain: 'unstoppable.academy',
    url: 'https://unstoppable.academy/',
    title: 'Unstoppable Academy | AI operator training',
    ai_summary: 'Unstoppable Academy trains business operators to build and manage AI agents without coding.',
    ai_categories: ['Education & Tutoring', 'AI Agents & Autonomous'],
    ai_source: 'nextjs',
    dr: 2,
    went_live: '2026-09-08',
    first_seen: '2026-09-06',
    tld: 'academy',
    webserver: 'Vercel',
    http_status: 200,
    ai_startups: 1,
  },
];

const compare = {
  dr: (a, b) => (a.dr ?? -1) - (b.dr ?? -1),
  went_live: (a, b) => String(a.went_live).localeCompare(String(b.went_live)),
  first_seen: (a, b) => String(a.first_seen).localeCompare(String(b.first_seen)),
  domain: (a, b) => a.domain.localeCompare(b.domain),
};

/** The JSON body /api.php would return for these query parameters. */
export function fakeApi(searchParams) {
  const p = (key) => searchParams.get(key) ?? '';
  const q = p('q').toLowerCase();
  let list = SITES.filter((s) => {
    if (p('ai_startups') === '1' && !s.ai_startups) return false;
    if (p('ai_categories') && !s.ai_categories.includes(p('ai_categories'))) return false;
    if (!q) return true;
    if (q.includes('.')) return s.domain.includes(q.replace(/^www\./, '')); // domain lookup
    return [s.domain, s.title, s.ai_summary, ...s.ai_categories].join(' ').toLowerCase().includes(q);
  });
  const sort = p('sort') || 'went_live';
  if (compare[sort]) {
    const asc = p('order') === 'asc';
    list = [...list].sort((a, b) => (asc ? compare[sort](a, b) : compare[sort](b, a))); // stable for ties
  }
  const from = Number(p('from')) || 0;
  const size = Number(p('size')) || 20;
  const page = list.slice(from, from + size).map(({ ai_startups: _ai, ...rest }) => ({ ...rest, category: 'ai' }));
  return { ok: true, index: 'sites', total: list.length, from, size, count: page.length, results: page };
}
