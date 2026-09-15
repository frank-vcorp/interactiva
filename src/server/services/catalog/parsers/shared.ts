const PRICE_PAIR =
  /(\d{1,3}(?:,\d{3})+|\d+)\s+(\d{1,3}(?:,\d{3})+|\d+)\s*$/;

const YEAR_LINE = /^(\d{4})\s*-\s*(.+?)\s*-\s*(.+)$/;

export function parsePricePair(line: string): {
  values: Array<{ concept: string; amount: number; currency: string }>;
  text: string;
} | null {
  const match = line.match(PRICE_PAIR);
  if (!match) return null;
  const left = match[1].replace(/,/g, "");
  const right = match[2].replace(/,/g, "");
  const a = Number.parseInt(left, 10);
  const b = Number.parseInt(right, 10);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a < 1000 || b < 1000) {
    return null;
  }
  return {
    text: line.slice(0, match.index).trim(),
    values: [
      { concept: "Lista", amount: a, currency: "MXN" },
      { concept: "Venta", amount: b, currency: "MXN" },
    ],
  };
}

export function parseYearModelLine(line: string): {
  year: number;
  model: string;
  note: string;
} | null {
  const match = line.match(YEAR_LINE);
  if (!match) return null;
  const year = Number.parseInt(match[1], 10);
  if (year < 1980 || year > 2035) return null;
  return { year, model: match[2].trim(), note: match[3].trim() };
}

export function isBrandHeader(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 2 || trimmed.length > 60) return false;
  if (!/^[A-Z0-9][A-Z0-9\s\-–—/]+$/.test(trimmed)) return false;
  if (trimmed.includes("Store MX")) return false;
  return true;
}

export function cleanLine(line: string): string {
  return line
    .replace(/Store MX.*?5549/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}
