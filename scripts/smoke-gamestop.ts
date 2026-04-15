import { PlaywrightScraper } from "../src/clients/scraper/playwrightScraper.ts";

const GAMESTOP_URL =
  "https://www.gamestop.com/toys-games/trading-cards/products/riftbound-league-of-legends-spiritforged-champion-deck-rumble-spf/440804.html";

async function main(): Promise<void> {
  const mode = process.argv[2] ?? "headless";
  const scraper = new PlaywrightScraper(
    mode === "chrome"
      ? { channel: "chrome" }
      : mode === "headed"
        ? { headed: true }
        : mode === "chrome-headed"
          ? { channel: "chrome", headed: true }
          : {},
  );
  console.log(`mode: ${mode}`);
  const start = Date.now();
  const result = await scraper.fetch(GAMESTOP_URL);
  const elapsedMs = Date.now() - start;

  const blocked =
    result.status === 403 || /<title>Attention Required! \| Cloudflare<\/title>/.test(result.html);

  const jsonLdMatches = [
    ...result.html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
  ]
    .map((m) => m[1])
    .filter((s): s is string => typeof s === "string");
  const availability = jsonLdMatches.flatMap((block) => {
    const match = block.match(/"availability"\s*:\s*"([^"]+)"/);
    return match?.[1] ? [match[1]] : [];
  });

  console.log(`status: ${result.status}`);
  console.log(`final url: ${result.url}`);
  console.log(`html length: ${result.html.length}`);
  console.log(`elapsed: ${elapsedMs}ms`);
  console.log(`blocked: ${blocked}`);
  console.log(`jsonld blocks found: ${jsonLdMatches.length}`);
  console.log(`schema.org availability values: ${JSON.stringify(availability)}`);
  console.log("");
  jsonLdMatches.forEach((block, i) => {
    try {
      const parsed: unknown = JSON.parse(block);
      console.log(`--- jsonld[${i}] ---`);
      console.log(JSON.stringify(parsed, null, 2).slice(0, 800));
    } catch {
      console.log(`--- jsonld[${i}] (unparseable) ---`);
      console.log(block.slice(0, 400));
    }
  });

  const buttonHints = [
    ...result.html.matchAll(/<button[^>]*>([^<]*(?:cart|stock|buy|pickup|ship)[^<]*)<\/button>/gi),
  ]
    .map((m) => m[1]?.trim())
    .slice(0, 10);
  console.log("");
  console.log("button hints:", buttonHints);
}

await main();
