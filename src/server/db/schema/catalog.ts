import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const catalogSourceEnum = pgEnum("catalog_source", ["ebc", "lobato"]);

export const editionStatusEnum = pgEnum("edition_status", [
  "loaded",
  "processing",
  "processed",
  "published",
  "superseded",
  "failed",
]);

export const recordConfidenceEnum = pgEnum("record_confidence", [
  "interpreted",
  "discarded",
]);

export const catalogEditions = pgTable(
  "catalog_editions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    source: catalogSourceEnum("source").notNull(),
    editionLabel: text("edition_label").notNull(),
    status: editionStatusEnum("status").notNull().default("loaded"),
    pdfPath: text("pdf_path").notNull(),
    pdfSha256: text("pdf_sha256").notNull(),
    processedCount: integer("processed_count").notNull().default(0),
    discardedCount: integer("discarded_count").notNull().default(0),
    warningCount: integer("warning_count").notNull().default(0),
    errorCount: integer("error_count").notNull().default(0),
    totalPages: integer("total_pages"),
    processedPages: integer("processed_pages").notNull().default(0),
    warnings: jsonb("warnings").$type<string[]>().notNull().default([]),
    errors: jsonb("errors").$type<string[]>().notNull().default([]),
    comparisonNotes: jsonb("comparison_notes")
      .$type<string[]>()
      .notNull()
      .default([]),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    supersededAt: timestamp("superseded_at", { withTimezone: true }),
    restoredFromId: uuid("restored_from_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("catalog_editions_source_label_idx").on(
      table.source,
      table.editionLabel,
    ),
  ],
);

export const vehicleRecords = pgTable("vehicle_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  editionId: uuid("edition_id")
    .notNull()
    .references(() => catalogEditions.id, { onDelete: "cascade" }),
  brand: text("brand"),
  model: text("model"),
  year: integer("year"),
  version: text("version"),
  segment: text("segment"),
  attributes: jsonb("attributes").$type<Record<string, string>>().notNull().default({}),
  economicValues: jsonb("economic_values")
    .$type<Array<{ concept: string; amount: number; currency: string }>>()
    .notNull()
    .default([]),
  sourcePage: integer("source_page"),
  rawExcerpt: text("raw_excerpt"),
  confidence: recordConfidenceEnum("confidence").notNull().default("interpreted"),
  discardReason: text("discard_reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type CatalogEdition = typeof catalogEditions.$inferSelect;
export type VehicleRecord = typeof vehicleRecords.$inferSelect;
