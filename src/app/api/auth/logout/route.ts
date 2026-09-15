import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  destroySession,
  getCurrentUser,
} from "@/server/services/session";

export async function POST() {
  const user = await getCurrentUser();
  if (user) {
    await destroySession(user.id);
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
