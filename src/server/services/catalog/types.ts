export type CatalogSource = "ebc" | "lobato";

export type ParsedVehicleLine = {
  brand: string | null;
  model: string | null;
  year: number | null;
  version: string;
  segment: string | null;
  attributes: Record<string, string>;
  economicValues: Array<{ concept: string; amount: number; currency: string }>;
  rawExcerpt: string;
  confidence: "interpreted" | "discarded";
  discardReason?: string;
};

export type PageParseResult = {
  records: ParsedVehicleLine[];
  warnings: string[];
};
