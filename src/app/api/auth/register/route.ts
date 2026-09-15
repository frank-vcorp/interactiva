import { NextResponse } from "next/server";
import { z } from "zod";
import { isValidWhatsAppInput } from "@/lib/whatsapp";
import { registerClient } from "@/server/services/auth";

const schema = z.object({
  whatsapp: z.string().min(10),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const body = schema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });
  }

  if (!isValidWhatsAppInput(body.data.whatsapp)) {
    return NextResponse.json({ ok: false, code: "INVALID_WHATSAPP" }, { status: 400 });
  }

  const result = await registerClient(body.data.whatsapp, body.data.password);
  if (!result.ok) {
    const status = result.code === "WHATSAPP_EXISTS" ? 409 : 401;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json({ ok: true, role: result.role });
}
