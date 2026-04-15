# Guide: building a scraper for a new site

Follow this order every time you add a new site. It's designed to spend
the least effort on the easiest sites and reveal blockers early.

## 1. Probe feasibility (before writing any code)

Progressively escalate from the lightest tool to the heaviest. Stop at
the first one that returns a real page with the data you need.

1. **Plain `curl`** with a realistic UA:
   ```
   curl -sS -A "Mozilla/5.0 ..." -o /tmp/page.html -w "%{http_code}\n" <url>
   ```
   Check status and grep the HTML for the signal you want (e.g., price,
   "In Stock", a schema.org availability string). If the signal is there
   → `HttpScraper` is sufficient.
2. **`curl` with a full realistic header set** (`Accept`, `Accept-Language`,
   `Sec-Ch-Ua-*`, `Sec-Fetch-*`). Some sites accept plain-looking requests
   once headers look complete. Still no browser.
3. **Headless Chromium** (default `PlaywrightScraper`). Real browser, but
   bundled headless shell. Catches SPAs and basic JS rendering.
4. **Headless real Chrome** (`channel: "chrome"`, `--headless=new`).
   Same fingerprint as headed Chrome but no window.
5. **Headed real Chrome** (`channel: "chrome"`, `headed: true`). Visible
   window. Defeats most detection but disrupts the host machine.
6. **Persistent-context Chrome** (real user profile via `userDataDir`).
   Last-resort escalation for sites that fingerprint above and beyond.

Record which step worked in the per-site code so future-us doesn't
re-climb the ladder. If we landed on step 5, don't silently try to
demote to step 3 later without re-probing.

## 2. Smoke test the approach

Once you know which step works, write a small script under `scripts/`
named `smoke-<site>.ts` that:

- Uses the chosen `Scraper` configuration
- Fetches the real URL
- Logs status, elapsed time, and the raw signal (JSON-LD block, API
  payload, whatever the site exposes)

These smoke scripts stay in the repo as durable probes. They are **not**
run as part of `pnpm test` — they hit the real site and cost real time.
They are checked-in tools for answering "does this still work?" when a
site changes.

Convention: smoke scripts import from `src/` like any other code, take
simple `process.argv` flags, and print plain-text output. No test
framework. Run with `pnpm tsx scripts/smoke-<site>.ts`.

## 3. Pick the most stable signal

When choosing what to parse, prefer signals that change rarely. Ranked
by stability (most → least):

1. **Official APIs / XHR endpoints.** If the page's own JS hits
   `/api/product/123`, call that directly. It's the site's contract with
   itself, and they break it less often than their HTML.
2. **Schema.org structured data** (JSON-LD or microdata). Purpose-built
   for machines, exists specifically so Google and others don't depend
   on CSS. Look for `<script type="application/ld+json">` and parse
   `offers.availability`, `offers.price`, etc.
3. **Open Graph / Twitter Card meta tags** (`<meta property="og:...">`).
   Stable because they drive link previews.
4. **`data-*` attributes** and stable IDs (e.g., `data-product-id`,
   `id="add-to-cart"`). Usually stable because the site's own tests
   depend on them.
5. **ARIA labels and roles**. Stable because accessibility.
6. **Semantic text** (visible copy like "Out of stock"). Medium
   stability — copy changes, localization varies.
7. **CSS classes**. Unstable, especially for sites using Tailwind,
   CSS-in-JS, or hashed class names. Avoid as primary signal.
8. **DOM position / `nth-child`**. Never rely on this.

Always prefer the highest-stability signal available. If the site
exposes both JSON-LD and a CSS-class-based stock flag, parse the
JSON-LD. Document which signal you chose and why, so a future maintainer
can reason about a fallback if it disappears.

## 4. Write the parser, then the tests

- Per-site parsers live under `bots/<bot>/sites/<site>.ts`.
- Parsers take raw HTML (or structured data) and return a typed domain
  object (e.g., `StockResult`). No network calls inside the parser.
- Unit tests use a small fixture HTML file
  (`bots/<bot>/sites/<site>.fixture.html`) containing just the signal
  we extract. Not the full ~700 KB page — a minimal document with the
  relevant JSON-LD block is enough.
- One integration test per site under `/integration` hits the real URL
  using the real `Scraper`. Run sparingly.

## 5. Log the ladder in the site file

At the top of `bots/<bot>/sites/<site>.ts`, include a brief comment:

```ts
// Feasibility: requires headed real Chrome (ladder step 5).
// Cloudflare blocks all headless modes. Signal: schema.org JSON-LD
// `offers.availability`.
```

One or two lines. Captures the *why* so future-us doesn't re-litigate.
