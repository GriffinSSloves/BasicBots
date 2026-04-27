// GameStop site handler for Riftbound stock checking.
//
// Feasibility: requires headed real Chrome (scraper ladder step 5).
// Cloudflare on gamestop.com blocks every headless configuration we tried
// (bundled Chromium, real Chrome, and --headless=new). See
// docs/guides/building-a-scraper.md and scripts/smoke-gamestop.ts.
//
// Signal: schema.org JSON-LD. Each product page embeds a
// <script type="application/ld+json"> block with @type "Product" whose
// `offers.availability` is a schema.org URL (InStock / OutOfStock / PreOrder).
// JSON-LD is the most stable signal — it powers Google shopping results, so
// GameStop has a strong incentive not to break it.

import { load } from "cheerio";
import type { Scraper } from "../../../src/clients/scraper/scraper.ts";
import type { Availability, StockResult } from "../types.ts";

const RETAILER = "gamestop";

export type ParsedGamestopProduct = {
  name: string;
  availability: Availability;
  priceCents?: number;
  currency?: string;
};

export class GamestopParseError extends Error {
  override readonly name = "GamestopParseError";
}

export function parseGamestopHtml(html: string): ParsedGamestopProduct {
  const product = findProductJsonLd(html);
  if (!product) {
    throw new GamestopParseError("No JSON-LD Product block found on GameStop page");
  }

  const nameRaw = product.name;
  const name = typeof nameRaw === "string" ? nameRaw : "unknown";
  const offers = pickOffers(product.offers);
  const availability = extractAvailability(offers?.availability);
  const priceCents = extractPriceCents(offers?.price);
  const currency = typeof offers?.priceCurrency === "string" ? offers.priceCurrency : undefined;

  return {
    name,
    availability,
    ...(priceCents !== undefined ? { priceCents } : {}),
    ...(currency !== undefined ? { currency } : {}),
  };
}

export async function fetchGamestopStock(scraper: Scraper, url: string): Promise<StockResult> {
  const { html } = await scraper.fetch(url);
  const parsed = parseGamestopHtml(html);
  return {
    retailer: RETAILER,
    url,
    name: parsed.name,
    availability: parsed.availability,
    checkedAt: new Date(),
    ...(parsed.priceCents !== undefined ? { priceCents: parsed.priceCents } : {}),
    ...(parsed.currency !== undefined ? { currency: parsed.currency } : {}),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function findProductJsonLd(html: string): Record<string, unknown> | undefined {
  const $ = load(html);
  const scripts = $('script[type="application/ld+json"]').toArray();
  for (const el of scripts) {
    const raw = $(el).contents().text().trim();
    if (!raw) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    const candidates: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
    for (const candidate of candidates) {
      if (isRecord(candidate) && candidate["@type"] === "Product") {
        return candidate;
      }
    }
  }
  return undefined;
}

function pickOffers(raw: unknown): Record<string, unknown> | undefined {
  if (Array.isArray(raw)) {
    const first: unknown = raw[0];
    return isRecord(first) ? first : undefined;
  }
  return isRecord(raw) ? raw : undefined;
}

function extractAvailability(raw: unknown): Availability {
  if (typeof raw !== "string") return "unknown";
  const normalized = raw.toLowerCase();
  if (normalized.endsWith("instock")) return "in_stock";
  if (normalized.endsWith("outofstock") || normalized.endsWith("soldout")) return "out_of_stock";
  if (normalized.endsWith("preorder") || normalized.endsWith("presale")) return "preorder";
  return "unknown";
}

function extractPriceCents(raw: unknown): number | undefined {
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.round(raw * 100);
  if (typeof raw === "string") {
    const cleaned = raw.replace(/[^0-9.]/g, "");
    if (cleaned.length === 0) return undefined;
    const n = Number(cleaned);
    if (Number.isFinite(n)) return Math.round(n * 100);
  }
  return undefined;
}
