import { NextResponse } from "next/server";
import { requireSuperuser } from "@/server/services/admin-auth";
import {
  getEdition,
  retryEditionProcessing,
} from "@/server/services/catalog/import-service";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await requireSuperuser();
    if (!user) {
      return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await params;
    const edition = await getEdition(id);
    if (!edition) {
      return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
    }

    await retryEditionProcessing(id);

    return NextResponse.json({
      ok: true,
      message: "OCR reencolado. El progreso aparecerá en unos segundos.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[catalog-import] retry failed", message);
    return NextResponse.json(
      { ok: false, code: "RETRY_FAILED", message },
      { status: 400 },
    );
  }
}
