CREATE TYPE "public"."catalog_source" AS ENUM('ebc', 'lobato');--> statement-breakpoint
CREATE TYPE "public"."edition_status" AS ENUM('loaded', 'processing', 'processed', 'published', 'superseded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."record_confidence" AS ENUM('interpreted', 'discarded');--> statement-breakpoint
CREATE TABLE "catalog_editions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "catalog_source" NOT NULL,
	"edition_label" text NOT NULL,
	"status" "edition_status" DEFAULT 'loaded' NOT NULL,
	"pdf_path" text NOT NULL,
	"pdf_sha256" text NOT NULL,
	"processed_count" integer DEFAULT 0 NOT NULL,
	"discarded_count" integer DEFAULT 0 NOT NULL,
	"warning_count" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"total_pages" integer,
	"processed_pages" integer DEFAULT 0 NOT NULL,
	"warnings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"comparison_notes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"published_at" timestamp with time zone,
	"superseded_at" timestamp with time zone,
	"restored_from_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"edition_id" uuid NOT NULL,
	"brand" text,
	"model" text,
	"year" integer,
	"version" text,
	"segment" text,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"economic_values" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_page" integer,
	"raw_excerpt" text,
	"confidence" "record_confidence" DEFAULT 'interpreted' NOT NULL,
	"discard_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vehicle_records" ADD CONSTRAINT "vehicle_records_edition_id_catalog_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."catalog_editions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_editions_source_label_idx" ON "catalog_editions" USING btree ("source","edition_label");
