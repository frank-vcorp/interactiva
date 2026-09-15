import { createHash, randomBytes } from "crypto";
import { eq, and, gt } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/env";
import { getDb } from "@/server/db/client";
import { sessions, users } from "@/server/db/schema";

const COOKIE_NAME = "interactiva_session";
const SESSION_TTL_DAYS = 30;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function getSecretKey() {
  return new TextEncoder().encode(getEnv().SESSION_SECRET);
}

export type SessionUser = {
  id: string;
  whatsapp: string | null;
  role: "client" | "superuser";
};

export async function createSession(userId: string): Promise<string> {
  const db = getDb();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);

  const [session] = await db
    .insert(sessions)
    .values({
      userId,
      tokenHash: hashToken(token),
      expiresAt,
    })
    .returning();

  await db
    .update(users)
    .set({ activeSessionId: session.id, updatedAt: new Date() })
    .where(eq(users.id, userId));

  const jwt = await new SignJWT({ sid: session.id, uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_DAYS}d`)
    .sign(getSecretKey());

  return jwt;
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: getEnv().COOKIE_SECURE ?? getEnv().NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const sessionId = payload.sid as string;
    const userId = payload.uid as string;
    if (!sessionId || !userId) return null;

    const db = getDb();
    const now = new Date();

    const [user] = await db
      .select({
        id: users.id,
        whatsapp: users.whatsapp,
        role: users.role,
        activeSessionId: users.activeSessionId,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.activeSessionId !== sessionId) return null;

    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now)),
      )
      .limit(1);

    if (!session) return null;

    return {
      id: user.id,
      whatsapp: user.whatsapp,
      role: user.role,
    };
  } catch {
    return null;
  }
}

export async function destroySession(userId: string): Promise<void> {
  const db = getDb();
  const [user] = await db
    .select({ activeSessionId: users.activeSessionId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user?.activeSessionId) {
    await db.delete(sessions).where(eq(sessions.id, user.activeSessionId));
  }

  await db
    .update(users)
    .set({ activeSessionId: null, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function hasActiveSession(userId: string): Promise<boolean> {
  const db = getDb();
  const now = new Date();
  const [user] = await db
    .select({ activeSessionId: users.activeSessionId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.activeSessionId) return false;

  const [session] = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(
      and(
        eq(sessions.id, user.activeSessionId),
        gt(sessions.expiresAt, now),
      ),
    )
    .limit(1);

  return Boolean(session);
}
