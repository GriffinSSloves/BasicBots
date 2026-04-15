import { chromium, type Browser } from "rebrowser-playwright";
import type { ScrapeOptions, ScrapeResult, Scraper } from "./scraper.ts";

export type PlaywrightScraperOptions = {
  /** Launch a visible browser window. Default: false (headless). */
  headed?: boolean;
  /**
   * Browser channel to use (e.g., "chrome" to use the installed Chrome instead of the
   * bundled Chromium headless shell). Using real Chrome matches a real user's TLS/JA3
   * fingerprint and often defeats Cloudflare-grade bot detection.
   */
  channel?: "chrome" | "msedge";
  /** Path to a persistent user data directory. When set, uses a real-profile browser context. */
  userDataDir?: string;
};

const DEFAULT_TIMEOUT_MS = 15_000;

export class PlaywrightScraper implements Scraper {
  readonly #options: PlaywrightScraperOptions;

  constructor(options: PlaywrightScraperOptions = {}) {
    this.#options = options;
  }

  async fetch(url: string, options: ScrapeOptions = {}): Promise<ScrapeResult> {
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const browser = await this.#launch();
    try {
      const context = await browser.newContext(
        options.userAgent ? { userAgent: options.userAgent } : {},
      );
      const page = await context.newPage();
      const response = await page.goto(url, {
        timeout: timeoutMs,
        waitUntil: "domcontentloaded",
      });
      const status = response?.status() ?? 0;
      // Give client-side JS (incl. Cloudflare challenges and hydration) a moment to settle.
      await page.waitForLoadState("load", { timeout: timeoutMs }).catch(() => {});
      await page.waitForTimeout(2000);
      const finalUrl = page.url();
      const html = await page.content();
      await context.close();
      return { url: finalUrl, status, html };
    } finally {
      await browser.close();
    }
  }

  async #launch(): Promise<Browser> {
    const headed = this.#options.headed ?? false;
    return chromium.launch({
      headless: !headed,
      ...(this.#options.channel ? { channel: this.#options.channel } : {}),
      // When running real Chrome headless, opt into Chrome's "new" headless mode,
      // which exposes a fingerprint identical to headed Chrome.
      ...(this.#options.channel === "chrome" && !headed ? { args: ["--headless=new"] } : {}),
    });
  }
}
