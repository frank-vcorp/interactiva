import { eq } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { clientSubscriptions } from "@/server/db/schema";

const ACCESS_DAYS = 30;
const PRODUCT_PRICE_MXN = 50;

export { ACCESS_DAYS, PRODUCT_PRICE_MXN };

export type AccessStatus = "none" | "active" | "expired";

export type AccessInfo = {
  status: AccessStatus;
  expiresAt: Date | null;
  autoRenewalEnabled: boolean;
};

function nowMx(): Date {
  return new Date();
}

export async function getAccessInfo(userId: string): Promise<AccessInfo> {
  const db = getDb();
  const [sub] = await db
    .select()
    .from(clientSubscriptions)
    .where(eq(clientSubscriptions.userId, userId))
    .limit(1);

  if (!sub?.expiresAt) {
    return {
      status: "none",
      expiresAt: null,
      autoRenewalEnabled: sub?.autoRenewalEnabled ?? true,
    };
  }

  const active = sub.expiresAt.getTime() > nowMx().getTime();
  return {
    status: active ? "active" : "expired",
    expiresAt: sub.expiresAt,
    autoRenewalEnabled: sub.autoRenewalEnabled,
  };
}

export async function hasPaidAccess(userId: string): Promise<boolean> {
  const info = await getAccessInfo(userId);
  return info.status === "active";
}

export async function extendAccess(userId: string): Promise<Date> {
  const db = getDb();
  const now = nowMx();
  const info = await getAccessInfo(userId);

  let newExpiry: Date;
  if (info.status === "active" && info.expiresAt) {
    newExpiry = new Date(info.expiresAt);
    newExpiry.setDate(newExpiry.getDate() + ACCESS_DAYS);
  } else {
    newExpiry = new Date(now);
    newExpiry.setDate(newExpiry.getDate() + ACCESS_DAYS);
  }

  await db
    .insert(clientSubscriptions)
    .values({
      userId,
      expiresAt: newExpiry,
      autoRenewalEnabled: true,
      nextRenewalAt: newExpiry,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: clientSubscriptions.userId,
      set: {
        expiresAt: newExpiry,
        nextRenewalAt: newExpiry,
        updatedAt: now,
      },
    });

  return newExpiry;
}

export async function setAutoRenewal(
  userId: string,
  enabled: boolean,
): Promise<void> {
  const db = getDb();
  const info = await getAccessInfo(userId);

  await db
    .insert(clientSubscriptions)
    .values({
      userId,
      expiresAt: info.expiresAt,
      autoRenewalEnabled: enabled,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: clientSubscriptions.userId,
      set: {
        autoRenewalEnabled: enabled,
        updatedAt: new Date(),
      },
    });
}
