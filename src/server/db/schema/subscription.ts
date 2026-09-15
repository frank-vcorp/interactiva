import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const mpConfigStatusEnum = pgEnum("mp_config_status", [
  "configured",
  "missing",
  "error",
]);

export const clientSubscriptions = pgTable("client_subscriptions", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  autoRenewalEnabled: boolean("auto_renewal_enabled").notNull().default(true),
  mpCustomerId: text("mp_customer_id"),
  mpCardId: text("mp_card_id"),
  nextRenewalAt: timestamp("next_renewal_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const mercadoPagoConfig = pgTable("mercado_pago_config", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicKey: text("public_key"),
  accessToken: text("access_token"),
  webhookSecret: text("webhook_secret"),
  status: mpConfigStatusEnum("status").notNull().default("missing"),
  lastError: text("last_error"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const paymentEvents = pgTable(
  "payment_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mpPaymentId: text("mp_payment_id").notNull(),
    mpStatus: text("mp_status").notNull(),
    amountMxn: integer("amount_mxn").notNull(),
    paymentMethod: text("payment_method"),
    applied: boolean("applied").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("payment_events_mp_payment_id_idx").on(table.mpPaymentId)],
);
