import { and, eq, ilike } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { clientSubscriptions, users } from "@/server/db/schema";
import { getAccessInfo } from "./access";

export async function searchClientsByWhatsApp(query: string) {
  if (!query.trim()) return [];
  const db = getDb();
  const digits = query.replace(/\D/g, "");
  const pattern = `%${digits.length >= 10 ? digits.slice(-10) : digits}%`;

  const rows = await db
    .select({
      id: users.id,
      whatsapp: users.whatsapp,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.role, "client"), ilike(users.whatsapp, pattern)))
    .limit(20);

  return rows.filter((r) => r.whatsapp);
}

export async function getClientDetail(userId: string) {
  const db = getDb();
  const [user] = await db
    .select({
      id: users.id,
      whatsapp: users.whatsapp,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.whatsapp) return null;

  const access = await getAccessInfo(userId);
  const [sub] = await db
    .select()
    .from(clientSubscriptions)
    .where(eq(clientSubscriptions.userId, userId))
    .limit(1);

  return {
    ...user,
    accessStatus: access.status,
    expiresAt: access.expiresAt,
    autoRenewalEnabled: sub?.autoRenewalEnabled ?? true,
  };
}
