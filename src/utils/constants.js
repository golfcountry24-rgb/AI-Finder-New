/**
 * Filters map 1:1 to real `ai_categories` values of the FreeSerp sites index.
 * Every value was verified against the live API (category=ai) — e.g. the docs
 * mention "Chatbot & Assistant", but the data uses "AI Chatbot & Assistant".
 * Nothing is assigned by hand: the API itself filters with `ai_categories=<value>`.
 */
export const CATEGORY_FILTERS = [
  { id: '', labelKey: 'filters.all' },
  { id: 'AI Chatbot & Assistant', labelKey: 'filters.chat' },
  { id: 'Image Generation', labelKey: 'filters.image' },
  { id: 'Video Generation', labelKey: 'filters.video' },
  { id: 'Voice & Text-to-Speech', labelKey: 'filters.voice' },
  { id: 'Audio & Music', labelKey: 'filters.audio' },
  { id: 'Code & Dev Tools', labelKey: 'filters.code' },
  { id: 'AI Agents & Autonomous', labelKey: 'filters.agents' },
  { id: 'AI Automation & Workflows', labelKey: 'filters.automation' },
  { id: 'Writing & Content', labelKey: 'filters.writing' },
  { id: 'Productivity', labelKey: 'filters.productivity' },
  { id: 'AI Search & Answers', labelKey: 'filters.search' },
  { id: 'Design & UI', labelKey: 'filters.design' },
  { id: 'Data & Analytics', labelKey: 'filters.data' },
  { id: 'Education & Tutoring', labelKey: 'filters.education' },
  { id: 'No-code / App Builder', labelKey: 'filters.nocode' },
];

/** Sort options → API `sort` + `order`. */
export const SORT_OPTIONS = [
  { id: 'relevance', labelKey: 'sort.relevance', sort: 'relevance', order: 'desc', needsQuery: true },
  { id: 'newest', labelKey: 'sort.newest', sort: 'went_live', order: 'desc' },
  { id: 'oldest', labelKey: 'sort.oldest', sort: 'went_live', order: 'asc' },
  { id: 'dr', labelKey: 'sort.dr', sort: 'dr', order: 'desc' },
  { id: 'az', labelKey: 'sort.az', sort: 'domain', order: 'asc' },
];

export const PAGE_SIZE = 24;

/** Human labels for ai_source values documented by FreeSerp. */
export const AI_SOURCE_LABELS = {
  lovable: 'Lovable',
  v0: 'v0',
  bolt: 'Bolt',
  base44: 'Base44',
  nextjs: 'Next.js',
  react: 'React',
  wordpress: 'WordPress',
  shopify: 'Shopify',
  wix: 'Wix',
  webflow: 'Webflow',
};
