import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/services/session";
import { searchVehicles } from "@/server/services/search";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "client") {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(request.url);
  const filters = {
    q: url.searchParams.get("q") ?? undefined,
    segment: url.searchParams.get("segment") ?? undefined,
    brand: url.searchParams.get("brand") ?? undefined,
    model: url.searchParams.get("model") ?? undefined,
    year: url.searchParams.get("year")
      ? Number.parseInt(url.searchParams.get("year")!, 10)
      : undefined,
    version: url.searchParams.get("version") ?? undefined,
  };

  const data = await searchVehicles(filters);
  return NextResponse.json({ ok: true, ...data });
}
