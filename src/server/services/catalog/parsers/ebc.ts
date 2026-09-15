import type { PageParseResult, ParsedVehicleLine } from "../types";
import { cleanLine, isBrandHeader } from "./shared";

const YEAR_HEADER = /^(\d{4})\s+(A\d|S\d|\w{2,})\b/;

export function parseEbcPage(text: string, pageNumber: number): PageParseResult {
  const warnings: string[] = [];
  const records: ParsedVehicleLine[] = [];

  let currentBrand: string | null = null;
  let currentYear: number | null = null;
  let currentGroup: string | null = null;

  for (const rawLine of text.split("\n")) {
    const line = cleanLine(rawLine);
    if (line.length < 4) continue;
    if (/^(LIBRO AZUL|Interactiva|MÉXICO|Continúa)/i.test(line)) continue;

    if (isBrandHeader(line) && line.length <= 40 && !line.includes(".")) {
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

    if (
      line.length >= 12 &&
      /(Sedán|Coupé|Coupe|Sportback|HB|SUV|Pick|Van|EV|Hybrid|Aut|T Aut|Quattro)/i.test(line)
    ) {
      if (!currentBrand) {
        records.push({
          brand: null,
          model: null,
          year: currentYear,
          version: line,
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
        model: inferModel(line, currentGroup),
        year: currentYear,
        version: line,
        segment: inferSegment(line),
        attributes: extractEbcAttributes(line),
        economicValues: [],
        rawExcerpt: line,
        confidence: "interpreted",
      });
    }
  }

  if (pageNumber <= 20 && records.length === 0) {
    warnings.push(`Página ${pageNumber}: índice o contenido preliminar EBC.`);
  }

  return { records, warnings };
}

function inferModel(line: string, group: string | null): string | null {
  if (group && !/Unidades/i.test(group)) return group;
  const modelMatch = line.match(/\b(A\d|S\d|Q\d|TT|A3|A4|A5|A6|A7|A8|X\d|Serie\s*\d)\b/i);
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

  return attrs;
}
