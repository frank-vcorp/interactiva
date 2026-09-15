import type { PageParseResult, ParsedVehicleLine } from "../types";
import {
  cleanLine,
  isBrandHeader,
  parsePricePair,
  parseYearModelLine,
} from "./shared";

export function parseLobatoPage(text: string, pageNumber: number): PageParseResult {
  const warnings: string[] = [];
  const records: ParsedVehicleLine[] = [];

  let currentBrand: string | null = null;
  let currentModel: string | null = null;
  let currentYear: number | null = null;
  let currentSegment: string | null = null;

  for (const rawLine of text.split("\n")) {
    const line = cleanLine(rawLine);
    if (line.length < 4) continue;
    if (/^(ÍNDICE|ABREVIATURAS|SECCIÓN|CONSULTE)/i.test(line)) continue;

    if (isBrandHeader(line) && !parsePricePair(line) && !parseYearModelLine(line)) {
      currentBrand = line.split(/\s-\s/)[0]?.trim() ?? line;
      continue;
    }

    const yearLine = parseYearModelLine(line);
    if (yearLine) {
      currentYear = yearLine.year;
      currentModel = yearLine.model;
      if (/SUV|SED|COUP|HATCH|PICK|VAN|EV|HEV|PU/i.test(yearLine.note)) {
        currentSegment = yearLine.note;
      }
      continue;
    }

    const priced = parsePricePair(line);
    if (priced) {
      if (!currentBrand) {
        records.push({
          brand: null,
          model: currentModel,
          year: currentYear,
          version: priced.text,
          segment: currentSegment,
          attributes: {},
          economicValues: [],
          rawExcerpt: line,
          confidence: "discarded",
          discardReason: "Marca no identificada en la página",
        });
        continue;
      }

      if (priced.text.length < 8) {
        records.push({
          brand: currentBrand,
          model: currentModel,
          year: currentYear,
          version: priced.text,
          segment: currentSegment,
          attributes: {},
          economicValues: priced.values,
          rawExcerpt: line,
          confidence: "discarded",
          discardReason: "Descripción de versión demasiado corta o ambigua",
        });
        continue;
      }

      records.push({
        brand: currentBrand,
        model: currentModel,
        year: currentYear,
        version: priced.text,
        segment: currentSegment,
        attributes: extractAttributes(priced.text),
        economicValues: priced.values,
        rawExcerpt: line,
        confidence: "interpreted",
      });
    }
  }

  if (pageNumber <= 15 && records.length === 0) {
    warnings.push(`Página ${pageNumber}: contenido preliminar (índice/glosario), sin registros vehiculares.`);
  }

  return { records, warnings };
}

function extractAttributes(version: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const doors = version.match(/^(\d)\s*Pts?\.?/i);
  if (doors) attrs.puertas = doors[1];

  const motor = version.match(/\b(L\d|V\d|EV|HEV|MHEV|PHEV)[^,]*/i);
  if (motor) attrs.motorizacion = motor[0].trim();

  const trans = version.match(/\b(TA\d?|TM\d?|CVT|TADCT|DCT|AUT)\b/i);
  if (trans) attrs.transmision = trans[0];

  const traction = version.match(/\b(4x4|quattro|AWD|FWD|RWD)\b/i);
  if (traction) attrs.traccion = traction[0];

  return attrs;
}
