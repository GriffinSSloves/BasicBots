# Scraping rules

Conservative posture: stay anonymous, stay polite, stay legal.

## No login for stock checking

Stock checkers (Riftbound, similar) must operate **logged out**. Public
product pages have everything we need. Logging in trades a recoverable
IP rate-limit for an account ban that's a pain to appeal — bad trade.

The exception is bots whose entire job is logged-in (e.g., the planned
ticket lobby-login bot). Those use a dedicated, sacrificial account and
are documented per-bot.

## Rate-limit etiquette

Enforced by the scheduler layer, not per-scraper:

- One product page per retailer per check. No catalog crawls, no
  multi-page sweeps.
- **At most ~1 check per minute per retailer**, ideally much less for
  high-protection sites (every 5–15 minutes).
- Add jitter (`±25%`) so checks aren't perfectly periodic.
- Honor `429 Too Many Requests` and `Retry-After` — exponential backoff,
  do not retry-storm.
- Default User-Agent should be the one Playwright/Chromium ships with.
  No spoofing as Googlebot or other crawlers.

## Choose the lightest tool that works

For each site, in order of preference:

1. **Official API** if one exists (TCGPlayer has one).
2. **HTTP + HTML parser** (`fetch` + `cheerio`) if the stock signal is
   in the server-rendered HTML.
3. **Headless Playwright** if the page needs JS.
4. **Headed / persistent-context Playwright** only if the site
   fingerprints headless mode and we genuinely need that retailer.

Escalate per-site as needed. Don't reach for Playwright on a site that
returns the data in plain HTML — slower, heavier, more detectable.

## Site-specific quirks belong in the bot, not in shared code

A site changes a CSS selector or moves a JSON endpoint — that's a
per-bot, per-site fix. `/src/clients/scraper` should know nothing about
GameStop's HTML structure. Per-site logic lives under
`/bots/<bot>/sites/<site>.ts`.
