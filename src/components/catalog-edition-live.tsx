"use client";

import { useEffect, useState } from "react";

type EditionPayload = {
  edition: {
    id: string;
    source: string;
    editionLabel: string;
    status: string;
    processedCount: number;
    discardedCount: number;
    warningCount: number;
    errorCount: number;
    totalPages: number | null;
    processedPages: number;
    warnings: string[];
    errors: string[];
    comparisonNotes: string[];
  };
  stats: { total: number; interpreted: number };
};

const STATUS_LABEL: Record<string, string> = {
  loaded: "Recibido",
  processing: "Procesando OCR",
  processed: "Lista para revisión",
  published: "Vigente",
  superseded: "Sustituida",
  failed: "Fallida",
};

export function CatalogEditionLive({
  editionId,
  initial,
}: {
  editionId: string;
  initial: EditionPayload;
}) {
  const [data, setData] = useState(initial);
  const [pollError, setPollError] = useState<string | null>(null);

  useEffect(() => {
    const active = ["loaded", "processing"].includes(data.edition.status);
    if (!active) return;

    const intervalMs = data.edition.status === "loaded" ? 2000 : 5000;

    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/catalogs/${editionId}`);
        if (!res.ok) {
          setPollError(`No se pudo consultar el estado (${res.status}).`);
          return;
        }
        const json = (await res.json()) as {
          ok?: boolean;
          edition?: EditionPayload["edition"];
          stats?: EditionPayload["stats"];
        };
        if (json.ok && json.edition && json.stats) {
          setPollError(null);
          setData({ edition: json.edition, stats: json.stats });
        }
      } catch {
        setPollError("Error de conexión al consultar el progreso.");
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [editionId, data.edition.status]);

  const { edition } = data;
  const progress =
    edition.totalPages && edition.totalPages > 0
      ? Math.round((edition.processedPages / edition.totalPages) * 100)
      : 0;

  const isActive = ["loaded", "processing"].includes(edition.status);

  return (
    <div className="space-y-4">
      {pollError && (
        <div className="rounded-lg border border-amber-300/50 bg-amber-50 p-3 text-sm text-amber-950">
          {pollError}
        </div>
      )}

      {edition.status === "failed" && edition.errors.length > 0 && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <h2 className="font-medium text-destructive">Importación fallida</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-destructive/90">
            {edition.errors.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {isActive && (
        <div
          className="rounded-xl border border-primary/20 bg-primary/5 p-4"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <div>
              <p className="font-medium text-primary">
                {edition.status === "loaded"
                  ? "PDF recibido. Iniciando OCR…"
                  : "Procesando OCR…"}
              </p>
              <p className="text-sm text-muted-foreground">
                Estado: {STATUS_LABEL[edition.status] ?? edition.status}
                {edition.totalPages
                  ? ` · página ${edition.processedPages}/${edition.totalPages}`
                  : ""}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Estado", STATUS_LABEL[edition.status] ?? edition.status],
          ["Interpretados", String(edition.processedCount)],
          ["Descartados", String(edition.discardedCount)],
          [
            "Páginas",
            `${edition.processedPages}/${edition.totalPages ?? "?"}`,
          ],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 font-medium">{value}</p>
          </div>
        ))}
      </div>

      {edition.status === "processing" && (
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Progreso OCR</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {edition.comparisonNotes.length > 0 && (
        <section className="rounded-xl border border-amber-300/50 bg-amber-50 p-4">
          <h2 className="font-medium text-amber-900">Advertencias comparativas</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-950">
            {edition.comparisonNotes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
      )}

      {edition.warnings.length > 0 && (
        <section className="rounded-xl border p-4">
          <h2 className="font-medium">Advertencias ({edition.warningCount})</h2>
          <ul className="mt-2 max-h-40 overflow-auto text-sm text-muted-foreground">
            {edition.warnings.slice(0, 20).map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </section>
      )}

      {edition.errors.length > 0 && edition.status !== "failed" && (
        <section className="rounded-xl border border-destructive/30 p-4">
          <h2 className="font-medium text-destructive">
            Errores parciales ({edition.errorCount})
          </h2>
          <ul className="mt-2 max-h-40 overflow-auto text-sm text-destructive/90">
            {edition.errors.slice(0, 20).map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
