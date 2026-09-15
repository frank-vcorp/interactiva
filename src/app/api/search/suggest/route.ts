import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/services/session";
import { getSuggestions } from "@/server/services/search";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "client") {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get("q") ?? "";
  const suggestions = await getSuggestions(q);
  return NextResponse.json({ ok: true, suggestions });
}
