import { NextResponse } from "next/server";
import { z } from "zod";
import { isValidWhatsAppInput } from "@/lib/whatsapp";
import { login } from "@/server/services/auth";

const schema = z.object({
  whatsapp: z.string().optional(),
  identifier: z.string().optional(),
  password: z.string().min(1),
  mode: z.enum(["client", "superuser"]).default("client"),
});

export async function POST(request: Request) {
  const body = schema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });
  }

  const identifier = body.data.mode === "superuser"
    ? body.data.identifier
    : body.data.whatsapp;

  if (!identifier) {
    return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });
  }

  if (
    body.data.mode === "client" &&
    !isValidWhatsAppInput(identifier)
  ) {
    return NextResponse.json({ ok: false, code: "INVALID_WHATSAPP" }, { status: 400 });
  }

  const result = await login(identifier, body.data.password, body.data.mode);
  if (!result.ok) {
    const status = result.code === "ACCOUNT_IN_USE" ? 409 : 401;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json({ ok: true, role: result.role });
}
