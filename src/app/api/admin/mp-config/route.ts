import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperuser } from "@/server/services/admin-auth";
import {
  getMpConfig,
  maskSecret,
  saveMpConfig,
  testMpConnection,
} from "@/server/services/mercadopago";

const schema = z.object({
  publicKey: z.string().min(8),
  accessToken: z.string().min(8),
});

export async function GET() {
  const user = await requireSuperuser();
  if (!user) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }

  const config = await getMpConfig();
  return NextResponse.json({
    ok: true,
    status: config?.status ?? "missing",
    publicKeyMasked: maskSecret(config?.publicKey),
    accessTokenMasked: maskSecret(config?.accessToken),
    lastError: config?.lastError ?? null,
  });
}

export async function POST(request: Request) {
  const user = await requireSuperuser();
  if (!user) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = schema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });
  }

  await saveMpConfig(body.data);
  const ok = await testMpConnection();
  if (!ok) {
    return NextResponse.json(
      { ok: false, message: "Credenciales guardadas pero la conexión falló." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
