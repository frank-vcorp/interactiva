import { NextResponse } from "next/server";
import { z } from "zod";
import { CATALOG_PDF_MAX_BYTES } from "@/lib/catalog-import-limits";
import { importErrorMessage } from "@/lib/catalog-import-messages";
import { requireSuperuser } from "@/server/services/admin-auth";
import {
  createImportFromUpload,
  queueEditionProcessing,
} from "@/server/services/catalog/import-service";
import type { CatalogSource } from "@/server/services/catalog/types";

export const maxDuration = 3600;

function isPdfFile(file: File): boolean {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return true;
  if (!file.type || file.type === "application/octet-stream") return name.endsWith(".pdf");
  return file.type === "application/pdf";
}

export async function POST(request: Request) {
  try {
    const user = await requireSuperuser();
    if (!user) {
      return NextResponse.json(
        { ok: false, code: "UNAUTHORIZED", message: importErrorMessage("UNAUTHORIZED") },
        { status: 401 },
      );
    }

    const form = await request.formData();
    const source = form.get("source");
    const file = form.get("file");

    const parsed = z.enum(["ebc", "lobato"]).safeParse(source);
    if (!parsed.success || !(file instanceof File)) {
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_INPUT",
          message: importErrorMessage("INVALID_INPUT"),
        },
        { status: 400 },
      );
    }

    if (!isPdfFile(file)) {
      console.warn("[catalog-import] rejected file", {
        name: file.name,
        type: file.type,
        size: file.size,
      });
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_FILE",
          message: importErrorMessage("INVALID_FILE"),
        },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.byteLength === 0) {
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_FILE",
          message:
            "El PDF llegó vacío al servidor. Si el archivo es grande, espera a que termine la subida o revisa el límite de tamaño.",
        },
        { status: 400 },
      );
    }

    if (buffer.byteLength > CATALOG_PDF_MAX_BYTES) {
      return NextResponse.json(
        {
          ok: false,
          code: "FILE_TOO_LARGE",
          message: importErrorMessage("FILE_TOO_LARGE"),
        },
        { status: 413 },
      );
    }

    console.info("[catalog-import] upload received", {
      source: parsed.data,
      name: file.name,
      bytes: buffer.byteLength,
    });

    const created = await createImportFromUpload(
      parsed.data as CatalogSource,
      buffer,
    );
    if ("error" in created) {
      return NextResponse.json(
        {
          ok: false,
          code: created.code,
          message: importErrorMessage(created.code, created.error),
          existingEditionId: created.existingEditionId,
        },
        { status: 409 },
      );
    }

    queueEditionProcessing(created.edition.id, {
      originalFilename: file.name,
    });

    console.info("[catalog-import] queued", {
      editionId: created.edition.id,
      source: parsed.data,
      reused: created.reused ?? false,
    });

    return NextResponse.json({
      ok: true,
      editionId: created.edition.id,
      status: "processing",
      reused: created.reused ?? false,
      message: created.reused
        ? "PDF ya existía en una importación pendiente. Reencolando OCR…"
        : "PDF recibido. El OCR comenzará en segundos.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[catalog-import] POST failed", message);
    return NextResponse.json(
      {
        ok: false,
        code: "SERVER_ERROR",
        message: importErrorMessage("SERVER_ERROR"),
        detail: message,
      },
      { status: 500 },
    );
  }
}
