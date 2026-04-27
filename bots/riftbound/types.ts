export type Availability = "in_stock" | "out_of_stock" | "preorder" | "unknown";

export type StockResult = {
  retailer: string;
  url: string;
  name: string;
  availability: Availability;
  priceCents?: number;
  currency?: string;
  checkedAt: Date;
};
