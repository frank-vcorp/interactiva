import { NextResponse } from "next/server";
import { requireSuperuser } from "@/server/services/admin-auth";
import { searchClientsByWhatsApp } from "@/server/services/admin-clients";

export async function GET(request: Request) {
  const user = await requireSuperuser();
  if (!user) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get("q") ?? "";
  const clients = await searchClientsByWhatsApp(q);
  return NextResponse.json({
    ok: true,
    clients: clients.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
  });
}
