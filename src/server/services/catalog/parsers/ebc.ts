import type { PageParseResult, ParsedVehicleLine } from "../types";
import { cleanLine, isBrandHeader, parsePricePair } from "./shared";

const YEAR_HEADER = /^(\d{4})\s+(A\d|S\d|Q\d|\w{2,})\b/;

export type EbcParseContext = {
  brand: string | null;
  year: number | null;
  group: string | null;
};

export type EbcPageParseResult = PageParseResult & {
  context: EbcParseContext;
};

const EMPTY_CONTEXT: EbcParseContext = {
  brand: null,
  year: null,
  group: null,
};

export function parseEbcPage(
  text: string,
  pageNumber: number,
  incoming: EbcParseContext = EMPTY_CONTEXT,
): EbcPageParseResult {
  const warnings: string[] = [];
  const records: ParsedVehicleLine[] = [];

  let currentBrand = incoming.brand;
  let currentYear = incoming.year;
  let currentGroup = incoming.group;

  for (const rawLine of text.split("\n")) {
    const line = normalizeEbcLine(cleanLine(rawLine));
    if (line.length < 4) continue;
    if (/^(LIBRO AZUL|Interactiva|MÉXICO|Continúa)/i.test(line)) continue;
    if (isGlossaryLine(line)) continue;

    if (isEbcBrandHeader(line)) {
      currentBrand = line;
      currentYear = null;
      currentGroup = null;
      continue;
    }

    const yearHeader = line.match(YEAR_HEADER);
    if (yearHeader) {
      currentYear = Number.parseInt(yearHeader[1], 10);
      currentGroup = yearHeader[2];
      continue;
    }

    if (/Unidades (Nuevas|Usadas)/i.test(line)) {
      currentGroup = line;
      continue;
    }

    if (!looksLikeVehicleLine(line)) continue;

    const priced = parsePricePair(line);
    const versionText = priced?.text ?? line;

    if (!currentBrand) {
      records.push({
        brand: null,
        model: null,
        year: currentYear,
        version: versionText,
        segment: null,
        attributes: {},
        economicValues: [],
        rawExcerpt: line,
        confidence: "discarded",
        discardReason: "Marca no identificada en la página",
      });
      continue;
    }

    records.push({
      brand: currentBrand,
      model: inferModel(versionText, currentGroup),
      year: currentYear,
      version: versionText,
      segment: inferSegment(versionText),
      attributes: extractEbcAttributes(versionText),
      economicValues: priced?.values ?? [],
      rawExcerpt: line,
      confidence: "interpreted",
    });
  }

  if (pageNumber <= 20 && records.length === 0) {
    warnings.push(`Página ${pageNumber}: índice o contenido preliminar EBC.`);
  }

  return {
    records,
    warnings,
    context: {
      brand: currentBrand,
      year: currentYear,
      group: currentGroup,
    },
  };
}

function normalizeEbcLine(line: string): string {
  return line
    .replace(/^p\s+(?=[A-Z])/i, "5p ")
    .replace(/^«<F\s+/i, "5p ")
    .replace(/^I\s+p\s+/i, "5p ");
}

function isGlossaryLine(line: string): boolean {
  if (/^[A-Z]{2,5}\s*=/.test(line)) return true;
  if (/=\s*(Transmisión|Vehicle|Vehículo|Velocidades|Hybrid|Eléctric)/i.test(line)) {
    return true;
  }
  if (/^(TA|HEV|MHEV|EV|PHEV|suv|HB|Aut)\s*=/i.test(line)) return true;
  if (/Elevadores Eléctricos|Sport Utility Vehicle/i.test(line)) return true;
  return false;
}

function isEbcBrandHeader(line: string): boolean {
  if (/continúa|continua/i.test(line)) return false;
  if (line.includes(".") || line.includes("=")) return false;
  if (line.split(/\s+/).length > 4) return false;
  if (!isBrandHeader(line) || line.length > 40) return false;
  return true;
}

function looksLikeVehicleLine(line: string): boolean {
  if (parsePricePair(line)) return true;
  if (/^\d{4}\s/.test(line)) return false;
  if (/\b(V6|V8|V10|V12|L3|L4|L5|L6)\b/i.test(line) && /\/[\d.]/i.test(line)) {
    return true;
  }
  if (/^\d\s*p\b/i.test(line)) return true;
  return (
    line.length >= 12 &&
    /(Sedán|Coupé|Coupe|Sportback|HB|SUV|Pick|Van|Flying|Continental|MDX|RDX|Quattro)/i.test(
      line,
    )
  );
}

function inferModel(line: string, group: string | null): string | null {
  if (group && !/Unidades/i.test(group)) return group;
  const modelMatch = line.match(
    /\b(A\d|S\d|Q\d|TT|A3|A4|A5|A6|A7|A8|X\d|MDX|RDX|ILX|TLX|NSX|Serie\s*\d|Clase\s*[A-Z])\b/i,
  );
  return modelMatch?.[0] ?? null;
}

function inferSegment(line: string): string | null {
  if (/SUV|Crossover|CUV/i.test(line)) return "SUV";
  if (/Sedán|Sedan/i.test(line)) return "Sedán";
  if (/Coupé|Coupe/i.test(line)) return "Coupé";
  if (/Sportback/i.test(line)) return "Sportback";
  if (/Pick|Pickup/i.test(line)) return "Pick-up";
  if (/Van/i.test(line)) return "Van";
  if (/EV|Eléctrico/i.test(line)) return "EV";
  return null;
}

function extractEbcAttributes(line: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const doors = line.match(/^(\d)\s*p\b/i);
  if (doors) attrs.puertas = doors[1];

  const motor = line.match(/\b(L\d|V\d)[^,]*/i);
  if (motor) attrs.motorizacion = motor[0].trim();

  if (/Quattro/i.test(line)) attrs.traccion = "Quattro";
  if (/MHEV/i.test(line)) attrs.tecnologia = "MHEV";
  if (/EV/i.test(line)) attrs.tecnologia = "EV";
  if (/AWD/i.test(line)) attrs.traccion = "AWD";

  return attrs;
}
