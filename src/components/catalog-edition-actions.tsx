"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  editionId: string;
  status: string;
};

export function CatalogEditionActions({ editionId, status }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function runAction(
    kind: "publish" | "restore" | "retry",
    options?: { confirm?: string },
  ) {
    setLoading(kind);
    setError(null);

    if (options?.confirm && !window.confirm(options.confirm)) {
      setLoading(null);
      return;
    }

    const path =
      kind === "retry"
        ? `/api/admin/catalogs/${editionId}/retry`
        : `/api/admin/catalogs/${editionId}/${kind}`;

    try {
      const res = await fetch(path, { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message ?? "Acción no completada.");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(null);
    }
  }

  const canRetry = ["loaded", "processing", "failed"].includes(status);

  return (
    <div className="flex flex-wrap gap-2">
      {canRetry && (
        <Button
          variant="outline"
          onClick={() =>
            runAction("retry", {
              confirm:
                status === "processing"
                  ? "¿Reiniciar el OCR? Se perderá el progreso parcial."
                  : "¿Reintentar el procesamiento OCR de este PDF?",
            })
          }
          disabled={!!loading}
        >
          {loading === "retry" ? "Reencolando…" : "Reintentar OCR"}
        </Button>
      )}
      {status === "processed" && (
        <Button
          onClick={() =>
            runAction("publish", {
              confirm:
                "¿Publicar esta edición como vigente para su fuente?",
            })
          }
          disabled={!!loading}
        >
          {loading === "publish" ? "Publicando…" : "Publicar edición"}
        </Button>
      )}
      {status === "superseded" && (
        <Button
          variant="outline"
          onClick={() =>
            runAction("restore", {
              confirm:
                "¿Restaurar esta edición? La edición vigente actual quedará sustituida.",
            })
          }
          disabled={!!loading}
        >
          {loading === "restore" ? "Restaurando…" : "Restaurar edición"}
        </Button>
      )}
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
    </div>
  );
}
