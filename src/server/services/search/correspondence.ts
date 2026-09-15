import type { VehicleRecord } from "@/server/db/schema";
import { normalizeToken, tokensMatch } from "./normalize";

export function canMergeRecords(
  ebc: VehicleRecord,
  lobato: VehicleRecord,
): boolean {
  if (!ebc.brand || !lobato.brand) return false;
  if (!tokensMatch(ebc.brand, lobato.brand)) return false;

  if (ebc.year && lobato.year && ebc.year !== lobato.year) return false;

  if (ebc.model && lobato.model && !tokensMatch(ebc.model, lobato.model)) {
    return false;
  }

  if (ebc.version && lobato.version) {
    const ev = normalizeToken(ebc.version);
    const lv = normalizeToken(lobato.version);
    if (ev.length >= 8 && lv.length >= 8) {
      const overlap =
        ev.includes(lv.slice(0, 12)) ||
        lv.includes(ev.slice(0, 12)) ||
        sharedWords(ev, lv) >= 2;
      if (!overlap) return false;
    }
  }

  return true;
}

function sharedWords(a: string, b: string): number {
  const sa = new Set(a.split(/\s+/).filter((w) => w.length > 2));
  let count = 0;
  for (const w of b.split(/\s+/)) {
    if (w.length > 2 && sa.has(w)) count++;
  }
  return count;
}

export type SearchResultItem =
  | {
      kind: "unified";
      id: string;
      ebcRecordId: string;
      lobatoRecordId: string;
      brand: string | null;
      model: string | null;
      year: number | null;
      version: string | null;
      segment: string | null;
      score: number;
    }
  | {
      kind: "single";
      id: string;
      source: "ebc" | "lobato";
      recordId: string;
      brand: string | null;
      model: string | null;
      year: number | null;
      version: string | null;
      segment: string | null;
      score: number;
    };

export function buildSearchResults(
  ebcRecords: VehicleRecord[],
  lobatoRecords: VehicleRecord[],
  scoreFn: (r: VehicleRecord) => number,
): SearchResultItem[] {
  const usedEbc = new Set<string>();
  const usedLobato = new Set<string>();
  const results: SearchResultItem[] = [];

  for (const ebc of ebcRecords) {
    let best: VehicleRecord | null = null;
    for (const lobato of lobatoRecords) {
      if (usedLobato.has(lobato.id)) continue;
      if (canMergeRecords(ebc, lobato)) {
        if (!best || scoreFn(lobato) > scoreFn(best)) best = lobato;
      }
    }

    if (best) {
      usedEbc.add(ebc.id);
      usedLobato.add(best.id);
      results.push({
        kind: "unified",
        id: `par/${ebc.id}/${best.id}`,
        ebcRecordId: ebc.id,
        lobatoRecordId: best.id,
        brand: ebc.brand ?? best.brand,
        model: ebc.model ?? best.model,
        year: ebc.year ?? best.year,
        version: ebc.version ?? best.version,
        segment: ebc.segment ?? best.segment,
        score: scoreFn(ebc) + scoreFn(best),
      });
    }
  }

  for (const r of ebcRecords) {
    if (usedEbc.has(r.id)) continue;
    results.push({
      kind: "single",
      id: `ebc/${r.id}`,
      source: "ebc",
      recordId: r.id,
      brand: r.brand,
      model: r.model,
      year: r.year,
      version: r.version,
      segment: r.segment,
      score: scoreFn(r),
    });
  }

  for (const r of lobatoRecords) {
    if (usedLobato.has(r.id)) continue;
    results.push({
      kind: "single",
      id: `lobato/${r.id}`,
      source: "lobato",
      recordId: r.id,
      brand: r.brand,
      model: r.model,
      year: r.year,
      version: r.version,
      segment: r.segment,
      score: scoreFn(r),
    });
  }

  return results.sort((a, b) => b.score - a.score);
}
