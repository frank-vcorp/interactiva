"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Result = {
  kind: string;
  id: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  version: string | null;
  segment: string | null;
};

type FilterOptions = {
  segments: string[];
  brands: string[];
  models: string[];
  years: number[];
  versions: string[];
};

export function VehicleSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [segment, setSegment] = useState(searchParams.get("segment") ?? "");
  const [brand, setBrand] = useState(searchParams.get("brand") ?? "");
  const [model, setModel] = useState(searchParams.get("model") ?? "");
  const [year, setYear] = useState(searchParams.get("year") ?? "");
  const [version, setVersion] = useState(searchParams.get("version") ?? "");

  const [results, setResults] = useState<Result[]>([]);
  const [filters, setFilters] = useState<FilterOptions | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [hasCatalogs, setHasCatalogs] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildParams = useCallback(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (segment) p.set("segment", segment);
    if (brand) p.set("brand", brand);
    if (model) p.set("model", model);
    if (year) p.set("year", year);
    if (version) p.set("version", version);
    return p;
  }, [q, segment, brand, model, year, version]);

  useEffect(() => {
    const params = buildParams();
    router.replace(`/buscar?${params.toString()}`, { scroll: false });

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [searchRes, filterRes] = await Promise.all([
          fetch(`/api/search?${params.toString()}`),
          fetch(`/api/search/filters?${params.toString()}`),
        ]);
        const searchData = (await searchRes.json()) as {
          ok?: boolean;
          results?: Result[];
          hasCatalogs?: boolean;
        };
        const filterData = (await filterRes.json()) as {
          ok?: boolean;
          filters?: FilterOptions;
        };

        if (!searchRes.ok || !searchData.ok) {
          setError("No se pudo completar la búsqueda.");
          return;
        }

        setResults(searchData.results ?? []);
        setHasCatalogs(searchData.hasCatalogs ?? true);
        setFilters(filterData.filters ?? null);
      } catch {
        setError("Error de conexión.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [buildParams, router]);

  useEffect(() => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`);
      const data = (await res.json()) as { suggestions?: string[] };
      setSuggestions(data.suggestions ?? []);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  function vehicleHref(r: Result) {
    return `/vehiculo/${r.id}?${buildParams().toString()}`;
  }

  if (!hasCatalogs) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <h2 className="text-xl font-medium">Aún no hay catálogos publicados</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          Cuando el Superusuario publique EBC y Lobato, la búsqueda se activará
          automáticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="q">Buscar</Label>
        <Input
          id="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Marca, modelo, año, versión…"
        />
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                className="rounded-full border px-3 py-1 text-xs hover:bg-secondary"
                onClick={() => setQ(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <FilterSelect
          label="Tipo/Segmento"
          value={segment}
          onChange={setSegment}
          options={filters?.segments ?? []}
        />
        <FilterSelect
          label="Marca"
          value={brand}
          onChange={setBrand}
          options={filters?.brands ?? []}
        />
        <FilterSelect
          label="Modelo"
          value={model}
          onChange={setModel}
          options={filters?.models ?? []}
        />
        <FilterSelect
          label="Año"
          value={year}
          onChange={setYear}
          options={(filters?.years ?? []).map(String)}
        />
        <FilterSelect
          label="Versión"
          value={version}
          onChange={setVersion}
          options={filters?.versions ?? []}
        />
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Buscando…</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && results.length === 0 && (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          Sin coincidencias para tu búsqueda.
        </div>
      )}

      <ul className="divide-y rounded-xl border bg-card">
        {results.slice(0, 50).map((r) => (
          <li key={r.id}>
            <Link
              href={vehicleHref(r)}
              className="block px-4 py-4 hover:bg-secondary/40"
            >
              <p className="font-medium">
                {[r.brand, r.model, r.year].filter(Boolean).join(" · ")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {r.version}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {r.kind === "unified"
                  ? "EBC + Lobato"
                  : r.kind === "single"
                    ? "Una fuente"
                    : ""}
                {r.segment ? ` · ${r.segment}` : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
      >
        <option value="">Todos</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
