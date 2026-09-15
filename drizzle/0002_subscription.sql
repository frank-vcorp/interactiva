CREATE TYPE "public"."mp_config_status" AS ENUM('configured', 'missing', 'error');--> statement-breakpoint
CREATE TABLE "client_subscriptions" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone,
	"auto_renewal_enabled" boolean DEFAULT true NOT NULL,
	"mp_customer_id" text,
	"mp_card_id" text,
	"next_renewal_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mercado_pago_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_key" text,
	"access_token" text,
	"webhook_secret" text,
	"status" "mp_config_status" DEFAULT 'missing' NOT NULL,
	"last_error" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"mp_payment_id" text NOT NULL,
	"mp_status" text NOT NULL,
	"amount_mxn" integer NOT NULL,
	"payment_method" text,
	"applied" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "client_subscriptions" ADD CONSTRAINT "client_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_events_mp_payment_id_idx" ON "payment_events" USING btree ("mp_payment_id");
