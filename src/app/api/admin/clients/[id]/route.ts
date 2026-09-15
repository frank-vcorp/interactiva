import { NextResponse } from "next/server";
import { requireSuperuser } from "@/server/services/admin-auth";
import { getClientDetail } from "@/server/services/admin-clients";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await requireSuperuser();
  if (!user) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;
  const client = await getClientDetail(id);
  if (!client) {
    return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    client: {
      ...client,
      createdAt: client.createdAt.toISOString(),
      expiresAt: client.expiresAt?.toISOString() ?? null,
    },
  });
}
