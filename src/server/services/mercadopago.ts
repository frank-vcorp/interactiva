import { eq } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { mercadoPagoConfig, paymentEvents } from "@/server/db/schema";
import {
  ACCESS_DAYS,
  PRODUCT_PRICE_MXN,
  extendAccess,
} from "./access";

export type MpPublicStatus = {
  status: "configured" | "missing" | "error";
  publicKey: string | null;
  lastError: string | null;
};

export async function getMpConfig() {
  const db = getDb();
  const [row] = await db.select().from(mercadoPagoConfig).limit(1);
  return row ?? null;
}

export async function getMpPublicStatus(): Promise<MpPublicStatus> {
  const config = await getMpConfig();
  if (!config?.accessToken) {
    return { status: "missing", publicKey: null, lastError: null };
  }
  return {
    status: config.status,
    publicKey: config.publicKey,
    lastError: config.lastError,
  };
}

export async function saveMpConfig(input: {
  publicKey: string;
  accessToken: string;
  webhookSecret?: string;
}) {
  const db = getDb();
  const existing = await getMpConfig();

  const values = {
    publicKey: input.publicKey.trim(),
    accessToken: input.accessToken.trim(),
    webhookSecret: input.webhookSecret?.trim() || null,
    status: "configured" as const,
    lastError: null,
    updatedAt: new Date(),
  };

  if (existing) {
    await db
      .update(mercadoPagoConfig)
      .set(values)
      .where(eq(mercadoPagoConfig.id, existing.id));
  } else {
    await db.insert(mercadoPagoConfig).values(values);
  }
}

export async function testMpConnection(): Promise<boolean> {
  const config = await getMpConfig();
  if (!config?.accessToken) return false;

  try {
    const res = await fetch("https://api.mercadopago.com/users/me", {
      headers: { Authorization: `Bearer ${config.accessToken}` },
    });
    const ok = res.ok;
    const db = getDb();
    await db
      .update(mercadoPagoConfig)
      .set({
        status: ok ? "configured" : "error",
        lastError: ok ? null : `HTTP ${res.status}`,
        updatedAt: new Date(),
      })
      .where(eq(mercadoPagoConfig.id, config.id));
    return ok;
  } catch (err) {
    const db = getDb();
    await db
      .update(mercadoPagoConfig)
      .set({
        status: "error",
        lastError: String(err),
        updatedAt: new Date(),
      })
      .where(eq(mercadoPagoConfig.id, config.id));
    return false;
  }
}

export async function createCheckoutPreference(
  userId: string,
  baseUrl: string,
): Promise<{ initPoint: string } | { error: string }> {
  const config = await getMpConfig();
  if (!config?.accessToken || config.status !== "configured") {
    return { error: "Mercado Pago no está configurado." };
  }

  const body = {
    items: [
      {
        id: "interactiva-30d",
        title: "Interactiva — 30 días de acceso",
        quantity: 1,
        currency_id: "MXN",
        unit_price: PRODUCT_PRICE_MXN,
      },
    ],
    metadata: { user_id: userId },
    back_urls: {
      success: `${baseUrl}/cuenta?pago=ok`,
      failure: `${baseUrl}/cuenta?pago=error`,
      pending: `${baseUrl}/cuenta?pago=pending`,
    },
    auto_return: "approved",
    external_reference: userId,
    payment_methods: {
      excluded_payment_types: [],
    },
  };

  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return { error: "No se pudo crear la preferencia de pago." };
  }

  const data = (await res.json()) as { init_point?: string };
  if (!data.init_point) return { error: "Respuesta inválida de Mercado Pago." };
  return { initPoint: data.init_point };
}

export async function processPaymentNotification(
  paymentId: string,
): Promise<void> {
  const config = await getMpConfig();
  if (!config?.accessToken) return;

  const res = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      headers: { Authorization: `Bearer ${config.accessToken}` },
    },
  );
  if (!res.ok) return;

  const payment = (await res.json()) as {
    id: number;
    status: string;
    transaction_amount: number;
    payment_method_id?: string;
    external_reference?: string;
    metadata?: { user_id?: string };
  };

  const userId = payment.metadata?.user_id ?? payment.external_reference;
  if (!userId) return;

  const db = getDb();
  const inserted = await db
    .insert(paymentEvents)
    .values({
      userId,
      mpPaymentId: String(payment.id),
      mpStatus: payment.status,
      amountMxn: Math.round(payment.transaction_amount),
      paymentMethod: payment.payment_method_id ?? null,
      applied: false,
    })
    .onConflictDoNothing()
    .returning();

  if (inserted.length === 0) return;

  if (
    payment.status === "approved" &&
    Math.round(payment.transaction_amount) >= PRODUCT_PRICE_MXN
  ) {
    await extendAccess(userId);
    await db
      .update(paymentEvents)
      .set({ applied: true })
      .where(eq(paymentEvents.mpPaymentId, String(payment.id)));
  }
}

export function maskSecret(value: string | null | undefined): string {
  if (!value) return "—";
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}
