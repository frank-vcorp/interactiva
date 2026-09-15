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

export function CatalogEditionLive({
  editionId,
  initial,
}: {
  editionId: string;
  initial: EditionPayload;
}) {
  const [data, setData] = useState(initial);

  useEffect(() => {
    if (!["loaded", "processing"].includes(data.edition.status)) return;

    const timer = setInterval(async () => {
      const res = await fetch(`/api/admin/catalogs/${editionId}`);
      if (!res.ok) return;
      const json = (await res.json()) as { ok?: boolean; edition?: EditionPayload["edition"]; stats?: EditionPayload["stats"] };
      if (json.ok && json.edition && json.stats) {
        setData({ edition: json.edition, stats: json.stats });
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [editionId, data.edition.status]);

  const { edition } = data;
  const progress =
    edition.totalPages && edition.totalPages > 0
      ? Math.round((edition.processedPages / edition.totalPages) * 100)
      : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Estado", edition.status],
          ["Interpretados", String(edition.processedCount)],
          ["Descartados", String(edition.discardedCount)],
          ["Páginas", `${edition.processedPages}/${edition.totalPages ?? "?"}`],
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
            <span>Procesando OCR…</span>
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

      {edition.errors.length > 0 && (
        <section className="rounded-xl border border-destructive/30 p-4">
          <h2 className="font-medium text-destructive">Errores ({edition.errorCount})</h2>
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
