import { NextResponse } from "next/server";
import { listEditions } from "@/server/services/catalog/import-service";
import { requireSuperuser } from "@/server/services/admin-auth";

export async function GET() {
  const user = await requireSuperuser();
  if (!user) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }

  const editions = await listEditions();
  return NextResponse.json({ ok: true, editions });
}
