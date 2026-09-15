import { NextResponse } from "next/server";
import {
  getEdition,
  getEditionStats,
} from "@/server/services/catalog/import-service";
import { requireSuperuser } from "@/server/services/admin-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await requireSuperuser();
  if (!user) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;
  const edition = await getEdition(id);
  if (!edition) {
    return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  }

  const stats = await getEditionStats(id);
  return NextResponse.json({ ok: true, edition, stats });
}
