import { and, eq, ilike, or } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import {
  catalogEditions,
  vehicleRecords,
  type VehicleRecord,
} from "@/server/db/schema";
import { getPublishedEdition } from "@/server/services/catalog/import-service";
import { buildSearchResults, type SearchResultItem } from "./correspondence";
import { normalizeToken, scoreRelevance } from "./normalize";

export type SearchFilters = {
  q?: string;
  segment?: string;
  brand?: string;
  model?: string;
  year?: number;
  version?: string;
};

export type FilterOptions = {
  segments: string[];
  brands: string[];
  models: string[];
  years: number[];
  versions: string[];
};

async function getPublishedRecords(source: "ebc" | "lobato") {
  const edition = await getPublishedEdition(source);
  if (!edition) return { edition: null, records: [] as VehicleRecord[] };

  const db = getDb();
  const records = await db
    .select()
    .from(vehicleRecords)
    .where(
      and(
        eq(vehicleRecords.editionId, edition.id),
        eq(vehicleRecords.confidence, "interpreted"),
      ),
    );

  return { edition, records };
}

function applyFilters(records: VehicleRecord[], filters: SearchFilters) {
  return records.filter((r) => {
    if (filters.segment && normalizeToken(r.segment) !== normalizeToken(filters.segment)) {
      return false;
    }
    if (filters.brand && normalizeToken(r.brand) !== normalizeToken(filters.brand)) {
      return false;
    }
    if (filters.model && normalizeToken(r.model) !== normalizeToken(filters.model)) {
      return false;
    }
    if (filters.year && r.year !== filters.year) return false;
    if (
      filters.version &&
      normalizeToken(r.version) !== normalizeToken(filters.version)
    ) {
      return false;
    }
    if (filters.q) {
      const score = scoreRelevance(filters.q, [
        r.brand,
        r.model,
        r.version,
        r.segment,
        String(r.year ?? ""),
      ]);
      if (score <= 0) return false;
    }
    return true;
  });
}

export async function searchVehicles(filters: SearchFilters): Promise<{
  results: SearchResultItem[];
  hasCatalogs: boolean;
  ebcEdition: string | null;
  lobatoEdition: string | null;
}> {
  const [ebc, lobato] = await Promise.all([
    getPublishedRecords("ebc"),
    getPublishedRecords("lobato"),
  ]);

  const hasCatalogs = Boolean(ebc.edition || lobato.edition);
  if (!hasCatalogs) {
    return {
      results: [],
      hasCatalogs: false,
      ebcEdition: null,
      lobatoEdition: null,
    };
  }

  const ebcFiltered = applyFilters(ebc.records, filters);
  const lobatoFiltered = applyFilters(lobato.records, filters);

  const scoreFn = (r: VehicleRecord) =>
    filters.q
      ? scoreRelevance(filters.q, [
          r.brand,
          r.model,
          r.version,
          r.segment,
          String(r.year ?? ""),
        ])
      : 1;

  const results = buildSearchResults(ebcFiltered, lobatoFiltered, scoreFn);

  return {
    results: filters.q ? results.filter((r) => r.score > 0) : results,
    hasCatalogs: true,
    ebcEdition: ebc.edition?.editionLabel ?? null,
    lobatoEdition: lobato.edition?.editionLabel ?? null,
  };
}

export async function getFilterOptions(
  filters: SearchFilters,
): Promise<FilterOptions> {
  const [ebc, lobato] = await Promise.all([
    getPublishedRecords("ebc"),
    getPublishedRecords("lobato"),
  ]);
  const all = [...ebc.records, ...lobato.records];
  const filtered = applyFilters(all, filters);

  const uniq = <T,>(vals: T[]) =>
    [...new Set(vals.filter(Boolean))] as T[];

  return {
    segments: uniq(filtered.map((r) => r.segment).filter(Boolean) as string[]).sort(),
    brands: uniq(filtered.map((r) => r.brand).filter(Boolean) as string[]).sort(),
    models: uniq(filtered.map((r) => r.model).filter(Boolean) as string[]).sort(),
    years: uniq(filtered.map((r) => r.year).filter(Boolean) as number[]).sort(
      (a, b) => b - a,
    ),
    versions: uniq(filtered.map((r) => r.version).filter(Boolean) as string[]).sort(),
  };
}

export async function getSuggestions(q: string): Promise<string[]> {
  if (q.length < 2) return [];
  const db = getDb();
  const pattern = `%${q}%`;

  const rows = await db
    .select({
      brand: vehicleRecords.brand,
      model: vehicleRecords.model,
      version: vehicleRecords.version,
    })
    .from(vehicleRecords)
    .innerJoin(
      catalogEditions,
      eq(vehicleRecords.editionId, catalogEditions.id),
    )
    .where(
      and(
        eq(catalogEditions.status, "published"),
        eq(vehicleRecords.confidence, "interpreted"),
        or(
          ilike(vehicleRecords.brand, pattern),
          ilike(vehicleRecords.model, pattern),
          ilike(vehicleRecords.version, pattern),
        ),
      ),
    )
    .limit(20);

  const suggestions = new Set<string>();
  for (const row of rows) {
    if (row.brand && row.model) suggestions.add(`${row.brand} ${row.model}`);
    if (row.brand) suggestions.add(row.brand);
    if (row.model) suggestions.add(row.model);
    if (row.version) suggestions.add(row.version);
  }

  return [...suggestions].slice(0, 8);
}

export async function getVehicleDetail(params: {
  ebcRecordId?: string;
  lobatoRecordId?: string;
  singleRecordId?: string;
  singleSource?: "ebc" | "lobato";
}) {
  const db = getDb();

  async function loadRecord(id: string, source: "ebc" | "lobato") {
    const [row] = await db
      .select({
        record: vehicleRecords,
        edition: catalogEditions,
      })
      .from(vehicleRecords)
      .innerJoin(
        catalogEditions,
        eq(vehicleRecords.editionId, catalogEditions.id),
      )
      .where(
        and(
          eq(vehicleRecords.id, id),
          eq(catalogEditions.source, source),
          eq(catalogEditions.status, "published"),
          eq(vehicleRecords.confidence, "interpreted"),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  if (params.singleRecordId && params.singleSource) {
    const row = await loadRecord(params.singleRecordId, params.singleSource);
    if (!row) return null;
    return {
      brand: row.record.brand,
      model: row.record.model,
      year: row.record.year,
      version: row.record.version,
      segment: row.record.segment,
      ebc: params.singleSource === "ebc" ? row : null,
      lobato: params.singleSource === "lobato" ? row : null,
    };
  }

  const ebc = params.ebcRecordId
    ? await loadRecord(params.ebcRecordId, "ebc")
    : null;
  const lobato = params.lobatoRecordId
    ? await loadRecord(params.lobatoRecordId, "lobato")
    : null;

  if (!ebc && !lobato) return null;

  return {
    brand: ebc?.record.brand ?? lobato?.record.brand ?? null,
    model: ebc?.record.model ?? lobato?.record.model ?? null,
    year: ebc?.record.year ?? lobato?.record.year ?? null,
    version: ebc?.record.version ?? lobato?.record.version ?? null,
    segment: ebc?.record.segment ?? lobato?.record.segment ?? null,
    ebc,
    lobato,
  };
}
