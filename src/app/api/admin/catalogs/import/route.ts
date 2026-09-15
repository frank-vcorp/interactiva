import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperuser } from "@/server/services/admin-auth";
import {
  createImportFromUpload,
  processEdition,
} from "@/server/services/catalog/import-service";
import type { CatalogSource } from "@/server/services/catalog/types";

export const maxDuration = 300;

const MAX_BYTES = 250 * 1024 * 1024;

export async function POST(request: Request) {
  const user = await requireSuperuser();
  if (!user) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }

  const form = await request.formData();
  const source = form.get("source");
  const file = form.get("file");

  const parsed = z.enum(["ebc", "lobato"]).safeParse(source);
  if (!parsed.success || !(file instanceof File)) {
    return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ ok: false, code: "INVALID_FILE" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ ok: false, code: "FILE_TOO_LARGE" }, { status: 413 });
  }

  const created = await createImportFromUpload(parsed.data as CatalogSource, buffer);
  if ("error" in created) {
    return NextResponse.json(
      { ok: false, code: created.code, message: created.error },
      { status: 409 },
    );
  }

  void processEdition(created.edition.id).catch(async (err) => {
    console.error("[catalog-import]", err);
  });

  return NextResponse.json({
    ok: true,
    editionId: created.edition.id,
    status: "processing",
  });
}
