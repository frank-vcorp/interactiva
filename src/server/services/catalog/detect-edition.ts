import type { CatalogSource } from "./types";

const MONTHS =
  "ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE";

const EDITION_REGEX = new RegExp(
  `(${MONTHS})\\s+(20\\d{2})`,
  "i",
);

const MONTH_TITLE: Record<string, string> = {
  ENERO: "Enero",
  FEBRERO: "Febrero",
  MARZO: "Marzo",
  ABRIL: "Abril",
  MAYO: "Mayo",
  JUNIO: "Junio",
  JULIO: "Julio",
  AGOSTO: "Agosto",
  SEPTIEMBRE: "Septiembre",
  OCTUBRE: "Octubre",
  NOVIEMBRE: "Noviembre",
  DICIEMBRE: "Diciembre",
};

export function detectEditionLabel(coverText: string): string | null {
  const match = coverText.match(EDITION_REGEX);
  if (!match) return null;
  const month = match[1].toUpperCase();
  const year = match[2];
  return `${MONTH_TITLE[month] ?? match[1]} ${year}`;
}

export function detectSource(coverText: string): CatalogSource | null {
  const upper = coverText.toUpperCase();
  if (upper.includes("LIBRO AZUL") || /\bEBC\b/.test(upper)) return "ebc";
  if (upper.includes("LOBATO") || upper.includes("AUTOPRECIOS")) return "lobato";
  return null;
}

export function validateSourceMatch(
  expected: CatalogSource,
  detected: CatalogSource | null,
): boolean {
  if (!detected) return false;
  return detected === expected;
}
