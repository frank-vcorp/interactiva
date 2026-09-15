"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  editionId: string;
  status: string;
  isStale?: boolean;
  pdfAvailable?: boolean;
};

export function CatalogEditionActions({
  editionId,
  status,
  isStale = false,
  pdfAvailable = true,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function runAction(
    kind: "publish" | "restore" | "retry" | "cancel",
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
        : kind === "cancel"
          ? `/api/admin/catalogs/${editionId}/cancel`
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

  const canStop = ["loaded", "processing"].includes(status);
  const canRetry = ["loaded", "processing", "failed"].includes(status);

  return (
    <div className="flex flex-wrap gap-2">
      {canStop && (
        <Button
          variant="outline"
          className="border-destructive text-destructive hover:bg-destructive/10"
          onClick={() =>
            runAction("cancel", {
              confirm:
                "¿Detener esta importación? Podrás reintentar o volver a subir el PDF.",
            })
          }
          disabled={!!loading}
        >
          {loading === "cancel" ? "Deteniendo…" : "Detener OCR"}
        </Button>
      )}
      {canRetry && (
        <Button
          variant="outline"
          onClick={() =>
            runAction("retry", {
              confirm: !pdfAvailable
                ? undefined
                : status === "processing" && !isStale
                  ? "¿Reiniciar el OCR? Se perderá el progreso parcial."
                  : "¿Reintentar el procesamiento OCR de este PDF?",
            })
          }
          disabled={!!loading}
        >
          {loading === "retry" ? "Reencolando…" : "Reintentar OCR"}
        </Button>
      )}
      {!pdfAvailable && canRetry && (
        <Button asChild variant="default">
          <Link href="/admin/catalogos">Volver a subir PDF</Link>
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
