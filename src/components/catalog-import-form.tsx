"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function CatalogImportForm() {
  const router = useRouter();
  const [source, setSource] = useState<"ebc" | "lobato">("ebc");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Selecciona un PDF.");
      return;
    }

    setLoading(true);
    setError(null);

    const form = new FormData();
    form.set("source", source);
    form.set("file", file);

    try {
      const res = await fetch("/api/admin/catalogs/import", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as {
        ok?: boolean;
        editionId?: string;
        message?: string;
        code?: string;
      };

      if (!res.ok || !data.ok || !data.editionId) {
        setError(data.message ?? "No se pudo iniciar la importación.");
        return;
      }

      router.push(`/admin/catalogos/${data.editionId}`);
      router.refresh();
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-card p-6">
      <div className="space-y-2">
        <Label htmlFor="source">Fuente</Label>
        <select
          id="source"
          value={source}
          onChange={(e) => setSource(e.target.value as "ebc" | "lobato")}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="ebc">EBC</option>
          <option value="lobato">Lobato</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pdf">PDF del catálogo</Label>
        <input
          id="pdf"
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Subiendo…" : "Cargar y procesar"}
      </Button>
      <p className="text-xs text-muted-foreground">
        El procesamiento OCR puede tardar varios minutos. La edición vigente no
        se altera hasta publicar.
      </p>
    </form>
  );
}
