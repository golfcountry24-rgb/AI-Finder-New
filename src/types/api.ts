/**
 * Data model of the FreeSerp sites index (https://freeserp.ai/docs.php) as AI Finder uses it.
 *
 * `ApiSite` is one raw record exactly as the API sends it: every field is optional,
 * because the index fills them in over time and some sites never get them.
 * `Site` is the normalised shape the UI works with (see normalizeSite): only the
 * fields the app uses, missing values as `null`, never invented.
 */

/** Builder / stack signal documented by FreeSerp; other strings may appear. */
export type AiSource =
  | 'lovable'
  | 'v0'
  | 'bolt'
  | 'base44'
  | 'nextjs'
  | 'react'
  | 'wordpress'
  | 'shopify'
  | 'wix'
  | 'webflow'
  | 'ai_likely'
  | 'not_ai'
  | (string & {});

/** A calendar day from the API, "YYYY-MM-DD". */
export type IsoDate = string;

export interface ApiSite {
  domain?: string;
  url?: string;
  title?: string;
  ai_summary?: string;
  ai_categories?: unknown[];
  category?: string;
  ai_source?: AiSource;
  dr?: number;
  went_live?: IsoDate;
  first_seen?: IsoDate;
  fetched_at?: string;
  tld?: string;
  webserver?: string;
  http_status?: number;
  real_site?: 0 | 1 | '0' | '1';
  content_length?: number;
  html_size?: number;
  ip?: string;
  _score?: number;
}

/** Envelope of every /api.php answer. */
export interface ApiResponse {
  ok?: boolean;
  error?: string;
  index?: string;
  query?: string;
  total?: number | string;
  count?: number;
  from?: number | string;
  size?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  filters?: Record<string, string>;
  took_ms?: number;
  results?: ApiSite[];
}

/** A site as the UI sees it. */
export interface Site {
  domain: string;
  /** Safe http(s) link, or null when the API has none and the domain is missing. */
  url: string | null;
  title: string | null;
  summary: string | null;
  categories: string[];
  dr: number | null;
  wentLive: IsoDate | null;
  firstSeen: IsoDate | null;
  fetchedAt: string | null;
  aiSource: AiSource | null;
  tld: string | null;
  webserver: string | null;
  httpStatus: number | null;
}

/** normalizeSite keeps records without a domain as `domain: null`; searchSites drops them. */
export type MaybeSite = Omit<Site, 'domain'> & { domain: string | null };

export type SortField = 'relevance' | 'went_live' | 'dr' | 'domain' | 'first_seen';
export type SortOrder = 'asc' | 'desc';

export interface SearchOptions {
  /** Full-text query (title, AI summary, homepage text). */
  q?: string;
  /** Exact `ai_categories` value, e.g. "Image Generation". */
  aiCategory?: string;
  /** Only genuine AI-product niches (ai_startups=1). */
  aiStartups?: boolean;
  sort?: SortField;
  order?: SortOrder;
  from?: number;
  size?: number;
}

export interface SearchResult {
  total: number;
  from: number;
  /** Raw page length, used to compute the next `from` (results may be shorter after filtering). */
  count: number;
  results: Site[];
}

export type ApiErrorCode = 'network' | 'timeout' | 'status' | 'format';
