export type ScrapeOptions = {
  /** Override the default User-Agent. Per rules/scraping.md, prefer the implementation's default. */
  userAgent?: string;
  /** Hard timeout in ms. Default: 15000. */
  timeoutMs?: number;
};

export type ScrapeResult = {
  /** Final URL after redirects. */
  url: string;
  /** HTTP status code from the final response. */
  status: number;
  /** Fully-rendered page HTML. For browser scrapers this is post-JS. */
  html: string;
};

/**
 * Fetches a single web page and returns its HTML.
 *
 * Implementations:
 *  - HttpScraper: plain fetch + response body. For sites without bot protection.
 *  - PlaywrightScraper: real browser (rebrowser-playwright). For JS-rendered or protected sites.
 *
 * Per-site parsing (selectors, JSON path extraction) is the bot's job — not the scraper's.
 */
export type Scraper = {
  fetch(url: string, options?: ScrapeOptions): Promise<ScrapeResult>;
};
