import { NextResponse } from "next/server";
import { requireSuperuser } from "@/server/services/admin-auth";
import { cancelEditionProcessing } from "@/server/services/catalog/import-service";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await requireSuperuser();
    if (!user) {
      return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await params;
    await cancelEditionProcessing(id);

    return NextResponse.json({
      ok: true,
      message: "Importación detenida. Puedes reintentar o volver a subir el PDF.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, code: "CANCEL_FAILED", message },
      { status: 400 },
    );
  }
}
