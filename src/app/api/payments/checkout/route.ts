import { NextResponse } from "next/server";
import { createCheckoutPreference } from "@/server/services/mercadopago";
import { getCurrentUser } from "@/server/services/session";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "client") {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }

  const baseUrl = new URL(request.url).origin;
  const result = await createCheckoutPreference(user.id, baseUrl);

  if ("error" in result) {
    return NextResponse.json({ ok: false, message: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, initPoint: result.initPoint });
}
