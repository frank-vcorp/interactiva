import { eq } from "drizzle-orm";
import { normalizeWhatsApp } from "@/lib/whatsapp";
import { getDb } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { hashPassword, verifyPassword } from "./password";
import {
  createSession,
  destroySession,
  hasActiveSession,
  setSessionCookie,
} from "./session";

export type AuthResult =
  | { ok: true; role: "client" | "superuser" }
  | {
      ok: false;
      code: "INVALID_CREDENTIALS" | "ACCOUNT_IN_USE" | "WHATSAPP_EXISTS";
    };

function resolveLoginKey(
  identifier: string,
  mode: "client" | "superuser",
): string {
  if (mode === "superuser") {
    return identifier.trim().toLowerCase();
  }
  return normalizeWhatsApp(identifier);
}

export async function registerClient(
  whatsappInput: string,
  password: string,
): Promise<AuthResult> {
  const loginKey = resolveLoginKey(whatsappInput, "client");
  const db = getDb();

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.loginKey, loginKey))
    .limit(1);

  if (existing.length > 0) {
    return { ok: false, code: "WHATSAPP_EXISTS" };
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({
      loginKey,
      whatsapp: loginKey,
      passwordHash,
      role: "client",
    })
    .returning({ id: users.id, role: users.role });

  const token = await createSession(user.id);
  await setSessionCookie(token);
  return { ok: true, role: user.role };
}

export async function login(
  identifier: string,
  password: string,
  mode: "client" | "superuser" = "client",
): Promise<AuthResult> {
  const loginKey = resolveLoginKey(identifier, mode);
  const db = getDb();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.loginKey, loginKey))
    .limit(1);

  if (!user) return { ok: false, code: "INVALID_CREDENTIALS" };

  if (mode === "superuser" && user.role !== "superuser") {
    return { ok: false, code: "INVALID_CREDENTIALS" };
  }

  if (mode === "client" && user.role !== "client") {
    return { ok: false, code: "INVALID_CREDENTIALS" };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { ok: false, code: "INVALID_CREDENTIALS" };

  if (user.role === "client" && (await hasActiveSession(user.id))) {
    return { ok: false, code: "ACCOUNT_IN_USE" };
  }

  if (user.activeSessionId) {
    await destroySession(user.id);
  }

  const token = await createSession(user.id);
  await setSessionCookie(token);
  return { ok: true, role: user.role };
}

export async function changeSuperuserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<
  { ok: true } | { ok: false; code: "INVALID_CREDENTIALS" | "NOT_SUPERUSER" }
> {
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || user.role !== "superuser") {
    return { ok: false, code: "NOT_SUPERUSER" };
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) return { ok: false, code: "INVALID_CREDENTIALS" };

  const passwordHash = await hashPassword(newPassword);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return { ok: true };
}
