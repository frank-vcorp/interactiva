"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  CATALOG_PDF_MAX_BYTES,
  CATALOG_PDF_MAX_MB,
} from "@/lib/catalog-import-limits";
import {
  formatFileSize,
  importErrorMessage,
} from "@/lib/catalog-import-messages";

type ImportPhase = "idle" | "uploading" | "starting" | "done";
type LogLevel = "info" | "success" | "error";
type LogEntry = { id: number; level: LogLevel; message: string; at: string };

type ImportResponse = {
  ok?: boolean;
  editionId?: string;
  message?: string;
  code?: string;
  detail?: string;
  existingEditionId?: string;
  reused?: boolean;
};

function nowLabel() {
  return new Date().toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function uploadWithProgress(
  form: FormData,
  onProgress: (percent: number) => void,
): Promise<{ status: number; data: ImportResponse; raw: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/catalogs/import");
    xhr.responseType = "text";

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    };

    xhr.onload = () => {
      const raw = xhr.responseText ?? "";
      try {
        const data = JSON.parse(raw) as ImportResponse;
        resolve({ status: xhr.status, data, raw });
      } catch {
        reject(
          new Error(
            xhr.status >= 500
              ? `Error del servidor (${xhr.status}). Revisa los logs del contenedor.`
              : "Respuesta inválida del servidor.",
          ),
        );
      }
    };

    xhr.onerror = () => {
      reject(new Error("Error de red al subir el PDF. Revisa tu conexión."));
    };

    xhr.onabort = () => {
      reject(new Error("Subida cancelada."));
    };

    xhr.send(form);
  });
}

export function CatalogImportForm() {
  const router = useRouter();
  const logId = useRef(0);
  const [source, setSource] = useState<"ebc" | "lobato">("ebc");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<ImportPhase>("idle");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [existingEditionId, setExistingEditionId] = useState<string | null>(null);

  const busy = phase !== "idle";

  function pushLog(level: LogLevel, message: string) {
    logId.current += 1;
    setLogs((prev) => [
      ...prev,
      { id: logId.current, level, message, at: nowLabel() },
    ]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Selecciona un PDF.");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("El archivo debe tener extensión .pdf");
      return;
    }

    if (file.size > CATALOG_PDF_MAX_BYTES) {
      setError(`El PDF supera ${CATALOG_PDF_MAX_MB} MB (${formatFileSize(CATALOG_PDF_MAX_BYTES)}).`);
      return;
    }

    setPhase("uploading");
    setUploadPercent(0);
    setError(null);
    setExistingEditionId(null);
    setLogs([]);
    pushLog("info", `Archivo: ${file.name} (${formatFileSize(file.size)})`);
    pushLog("info", `Fuente: ${source.toUpperCase()}`);
    pushLog("info", "Subiendo PDF al servidor…");

    const form = new FormData();
    form.set("source", source);
    form.set("file", file);

    try {
      const { status, data } = await uploadWithProgress(form, setUploadPercent);

      if (status === 413) {
        throw new Error(importErrorMessage("FILE_TOO_LARGE"));
      }

      if (!data.ok || !data.editionId) {
        const message = importErrorMessage(data.code, data.message);
        pushLog("error", message);
        if (data.detail) pushLog("error", data.detail);
        if (data.existingEditionId) {
          setExistingEditionId(data.existingEditionId);
          pushLog(
            "info",
            `Importación existente: ${data.existingEditionId.slice(0, 8)}…`,
          );
        }
        setError(message);
        setPhase("idle");
        return;
      }

      setUploadPercent(100);
      setPhase("starting");
      if (data.reused) {
        pushLog("info", "Se reutilizó una importación anterior pendiente.");
      }
      pushLog("success", data.message ?? "PDF recibido correctamente.");
      pushLog("info", "Iniciando OCR en segundo plano…");

      setPhase("done");
      pushLog("success", "Redirigiendo al detalle de la importación…");

      router.push(`/admin/catalogos/${data.editionId}`);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error de conexión.";
      pushLog("error", message);
      setError(message);
      setPhase("idle");
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
          disabled={busy}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
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
          accept="application/pdf,.pdf"
          disabled={busy}
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setError(null);
          }}
          className="block w-full text-sm disabled:opacity-60"
        />
        {file && (
          <p className="text-xs text-muted-foreground">
            {file.name} · {formatFileSize(file.size)}
          </p>
        )}
      </div>

      {busy && (
        <div
          className="rounded-lg border border-primary/20 bg-primary/5 p-4"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <div>
              <p className="text-sm font-medium text-primary">
                {phase === "uploading" && "Subiendo PDF…"}
                {phase === "starting" && "Registrando importación…"}
                {phase === "done" && "Importación iniciada"}
              </p>
              <p className="text-xs text-muted-foreground">
                {phase === "uploading"
                  ? "No cierres esta pestaña hasta que termine la subida."
                  : "El OCR puede tardar horas en catálogos completos."}
              </p>
            </div>
          </div>

          {(phase === "uploading" || uploadPercent > 0) && (
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Progreso de subida</span>
                <span>{uploadPercent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${uploadPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {logs.length > 0 && (
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground">Registro</p>
          <ul className="mt-2 max-h-40 space-y-1 overflow-auto font-mono text-xs">
            {logs.map((entry) => (
              <li
                key={entry.id}
                className={
                  entry.level === "error"
                    ? "text-destructive"
                    : entry.level === "success"
                      ? "text-emerald-700"
                      : "text-muted-foreground"
                }
              >
                [{entry.at}] {entry.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-sm font-medium text-destructive">{error}</p>
          {existingEditionId && (
            <Link
              href={`/admin/catalogos/${existingEditionId}`}
              className="mt-2 inline-block text-sm text-primary underline-offset-4 hover:underline"
            >
              Ver importación existente →
            </Link>
          )}
        </div>
      )}

      <Button type="submit" disabled={busy || !file}>
        {busy ? "Importando…" : "Cargar y procesar"}
      </Button>

      <p className="text-xs text-muted-foreground">
        El procesamiento OCR puede tardar varios minutos (o horas en catálogos
        completos). La edición vigente no se altera hasta publicar.
      </p>
    </form>
  );
}
