import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { Scraper } from "../../../src/clients/scraper/scraper.ts";
import { GamestopParseError, fetchGamestopStock, parseGamestopHtml } from "./gamestop.ts";

const inStockFixture = readFileSync(
  fileURLToPath(new URL("./gamestop.in-stock.fixture.html", import.meta.url)),
  "utf8",
);
const outOfStockFixture = readFileSync(
  fileURLToPath(new URL("./gamestop.out-of-stock.fixture.html", import.meta.url)),
  "utf8",
);

describe("parseGamestopHtml", () => {
  it("extracts availability, name, price, and currency for an in-stock product", () => {
    const parsed = parseGamestopHtml(inStockFixture);
    expect(parsed.availability).toBe("in_stock");
    expect(parsed.name).toBe("Riftbound: League of Legends TCG - Origins Sleeved Booster");
    expect(parsed.priceCents).toBe(499);
    expect(parsed.currency).toBe("USD");
  });

  it("maps schema.org OutOfStock to out_of_stock", () => {
    const parsed = parseGamestopHtml(outOfStockFixture);
    expect(parsed.availability).toBe("out_of_stock");
    expect(parsed.priceCents).toBe(2999);
  });

  it("skips non-Product JSON-LD blocks and finds the Product in a mixed page", () => {
    // The out-of-stock fixture includes a BreadcrumbList before the Product block.
    const parsed = parseGamestopHtml(outOfStockFixture);
    expect(parsed.name).toContain("Rumble");
  });

  it("returns 'unknown' availability when the schema.org value is unexpected", () => {
    const html = outOfStockFixture.replace(
      "https://schema.org/OutOfStock",
      "https://schema.org/Discontinued",
    );
    const parsed = parseGamestopHtml(html);
    expect(parsed.availability).toBe("unknown");
  });

  it("throws GamestopParseError when no JSON-LD Product block is present", () => {
    const html = "<html><body>no structured data here</body></html>";
    expect(() => parseGamestopHtml(html)).toThrow(GamestopParseError);
  });

  it("handles malformed JSON-LD by skipping it rather than throwing", () => {
    const html = `
      <script type="application/ld+json">{ not valid json</script>
      ${outOfStockFixture}
    `;
    const parsed = parseGamestopHtml(html);
    expect(parsed.availability).toBe("out_of_stock");
  });
});

describe("fetchGamestopStock", () => {
  class FakeScraper implements Scraper {
    readonly #html: string;
    calledWith: string[] = [];
    constructor(html: string) {
      this.#html = html;
    }
    async fetch(url: string): Promise<{ url: string; status: number; html: string }> {
      this.calledWith.push(url);
      return { url, status: 200, html: this.#html };
    }
  }

  it("composes scraper + parser into a StockResult", async () => {
    const scraper = new FakeScraper(inStockFixture);
    const url = "https://www.gamestop.com/fake-product.html";

    const result = await fetchGamestopStock(scraper, url);

    expect(scraper.calledWith).toEqual([url]);
    expect(result.retailer).toBe("gamestop");
    expect(result.url).toBe(url);
    expect(result.availability).toBe("in_stock");
    expect(result.priceCents).toBe(499);
    expect(result.currency).toBe("USD");
    expect(result.checkedAt).toBeInstanceOf(Date);
  });
});
