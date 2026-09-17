import type { PageParseResult, ParsedVehicleLine } from "../types";
import {
  cleanLine,
  isBrandHeader,
  parsePricePair,
  parseYearModelLine,
} from "./shared";

export type LobatoParseContext = {
  brand: string | null;
  model: string | null;
  year: number | null;
  segment: string | null;
};

export type LobatoPageParseResult = PageParseResult & {
  context: LobatoParseContext;
};

const EMPTY_CONTEXT: LobatoParseContext = {
  brand: null,
  model: null,
  year: null,
  segment: null,
};

const SECTION_PREFIX = /^(?:PASAJEROS|COMERCIALES|PICK\s?UPS?|CAMIONES|UTILITARIOS)\s*[-–—]\s*/i;
const LOBATO_BRAND_LINE =
  /^[-–—_\s«<=]+([A-Z][A-Z0-9\s]{1,35}?)\s+v[\.\-]?[A-Za-z]{0,3}\b/i;
const SLASH_YEAR_LINE = /^(\d{4})\s*-\s*([^/]+?)\s*\/\s*(.+)$/;
const MODEL_ONLY = /^[A-Z][A-Za-z0-9][A-Za-z0-9\s\-]{0,24}$/;

export function parseLobatoPage(
  text: string,
  pageNumber: number,
  incoming: LobatoParseContext = EMPTY_CONTEXT,
): LobatoPageParseResult {
  const warnings: string[] = [];
  const records: ParsedVehicleLine[] = [];

  let currentBrand = incoming.brand;
  let currentModel = incoming.model;
  let currentYear = incoming.year;
  let currentSegment = incoming.segment;

  for (const rawLine of text.split("\n")) {
    const line = normalizeLobatoLine(cleanLine(rawLine));
    if (line.length < 4) continue;
    if (/^(ÍNDICE|ABREVIATURAS|SECCIÓN|CONSULTE|EDICIÓN)/i.test(line)) continue;
    if (/Store MX|WhatsApp/i.test(line)) continue;

    const sectionBrand = line.match(
      /^(?:PASAJEROS|COMERCIALES|PICK\s?UPS?|CAMIONES|UTILITARIOS)\s*[-–—]\s*(.+)$/i,
    );
    if (sectionBrand) {
      const brand = extractBrandToken(sectionBrand[1]);
      if (brand) {
        currentBrand = brand;
        currentModel = null;
        currentYear = null;
      }
      continue;
    }

    const lobatoBrand = line.match(LOBATO_BRAND_LINE);
    if (lobatoBrand) {
      const brand = extractBrandToken(lobatoBrand[1]);
      if (brand) {
        currentBrand = brand;
        currentModel = null;
        currentYear = null;
      }
      continue;
    }

    if (isLobatoBrandHeader(line) && !parsePricePair(line) && !parseYearModelLine(line)) {
      currentBrand = extractBrandToken(line.split(/\s-\s/)[0]?.trim() ?? line);
      currentModel = null;
      currentYear = null;
      continue;
    }

    const slashYear = line.match(SLASH_YEAR_LINE);
    if (slashYear) {
      currentYear = Number.parseInt(slashYear[1], 10);
      currentModel = slashYear[2].trim();
      if (/SUV|SED|COUP|HATCH|PICK|VAN|EV|HEV|PU|Nuevo|Usado/i.test(slashYear[3])) {
        currentSegment = slashYear[3].trim();
      }
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

    if (
      !parsePricePair(line) &&
      MODEL_ONLY.test(line) &&
      !isSectionLabel(line) &&
      line.split(/\s+/).length <= 3
    ) {
      currentModel = line.trim();
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
    warnings.push(
      `Página ${pageNumber}: índice o glosario (sin líneas con precio en esta página).`,
    );
  }

  return {
    records,
    warnings,
    context: {
      brand: currentBrand,
      model: currentModel,
      year: currentYear,
      segment: currentSegment,
    },
  };
}

function normalizeLobatoLine(line: string): string {
  return line
    .replace(SECTION_PREFIX, "")
    .replace(/^p\s+(?=[A-Z0-9])/i, "5p ")
    .replace(/^I\s+p\s+/i, "5p ")
    .trim();
}

function extractBrandToken(raw: string): string | null {
  const cleaned = raw
    .replace(SECTION_PREFIX, "")
    .replace(/\bv[\.\-]?[A-Za-z]{0,3}\b/gi, "")
    .replace(/[-–—_\s]+$/g, "")
    .trim();
  if (!cleaned || isSectionLabel(cleaned)) return null;
  if (cleaned.length < 2 || cleaned.length > 40) return null;
  return cleaned;
}

function isSectionLabel(line: string): boolean {
  return /^(PASAJEROS|COMERCIALES|PICK\s?UPS?|CAMIONES|UTILITARIOS|EDICIÓN)$/i.test(
    line.trim(),
  );
}

function isLobatoBrandHeader(line: string): boolean {
  if (SECTION_PREFIX.test(line)) return false;
  if (/continúa|continua|precio|lista|venta/i.test(line)) return false;
  if (line.includes(".") && !/\bv[\.\-]/i.test(line)) return false;
  if (line.split(/\s+/).length > 5) return false;
  return isBrandHeader(line);
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
