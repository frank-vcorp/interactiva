import { NextResponse } from "next/server";
import { z } from "zod";
import { changeSuperuserPassword } from "@/server/services/auth";
import { getCurrentUser } from "@/server/services/session";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "superuser") {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = schema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });
  }

  const result = await changeSuperuserPassword(
    user.id,
    body.data.currentPassword,
    body.data.newPassword,
  );

  if (!result.ok) {
    return NextResponse.json(result, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
