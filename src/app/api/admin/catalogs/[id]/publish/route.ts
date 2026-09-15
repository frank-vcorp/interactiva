import { NextResponse } from "next/server";
import { publishEdition } from "@/server/services/catalog/import-service";
import { requireSuperuser } from "@/server/services/admin-auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const user = await requireSuperuser();
  if (!user) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await publishEdition(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : "Error al publicar." },
      { status: 400 },
    );
  }
}
