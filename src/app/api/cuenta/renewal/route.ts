import { NextResponse } from "next/server";
import { z } from "zod";
import { setAutoRenewal } from "@/server/services/access";
import { getCurrentUser } from "@/server/services/session";

const schema = z.object({ enabled: z.boolean() });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "client") {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = schema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });
  }

  await setAutoRenewal(user.id, body.data.enabled);
  return NextResponse.json({ ok: true });
}
