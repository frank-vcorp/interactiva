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

  async function action(kind: "publish" | "restore") {
    setLoading(kind);
    setError(null);
    const confirmed =
      kind === "publish"
        ? window.confirm("¿Publicar esta edición como vigente para su fuente?")
        : window.confirm(
            "¿Restaurar esta edición? La edición vigente actual quedará sustituida.",
          );
    if (!confirmed) {
      setLoading(null);
      return;
    }

    try {
      const res = await fetch(`/api/admin/catalogs/${editionId}/${kind}`, {
        method: "POST",
      });
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

  return (
    <div className="flex flex-wrap gap-2">
      {status === "processed" && (
        <Button onClick={() => action("publish")} disabled={!!loading}>
          {loading === "publish" ? "Publicando…" : "Publicar edición"}
        </Button>
      )}
      {status === "superseded" && (
        <Button
          variant="outline"
          onClick={() => action("restore")}
          disabled={!!loading}
        >
          {loading === "restore" ? "Restaurando…" : "Restaurar edición"}
        </Button>
      )}
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
    </div>
  );
}
