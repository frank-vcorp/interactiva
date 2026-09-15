import { and, desc, eq, ne, sql } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import {
  catalogEditions,
  vehicleRecords,
  type CatalogEdition,
} from "@/server/db/schema";
import {
  detectEditionLabel,
  detectSource,
  validateSourceMatch,
} from "./detect-edition";
import { ocrPdfCover, ocrPdfPage, getPdfPageCount, assertOcrToolsAvailable } from "./ocr";
import { parseCatalogPage } from "./parsers";
import {
  getEditionPdfPath,
  saveEditionPdf,
  sha256Buffer,
} from "./storage";
import type { CatalogSource } from "./types";

export async function listEditions() {
  const db = getDb();
  return db
    .select()
    .from(catalogEditions)
    .orderBy(desc(catalogEditions.createdAt));
}

export async function getEdition(id: string) {
  const db = getDb();
  const [edition] = await db
    .select()
    .from(catalogEditions)
    .where(eq(catalogEditions.id, id))
    .limit(1);
  return edition ?? null;
}

export async function getPublishedEdition(source: CatalogSource) {
  const db = getDb();
  const [edition] = await db
    .select()
    .from(catalogEditions)
    .where(
      and(
        eq(catalogEditions.source, source),
        eq(catalogEditions.status, "published"),
      ),
    )
    .limit(1);
  return edition ?? null;
}

export async function createImportFromUpload(
  source: CatalogSource,
  pdfBuffer: Buffer,
): Promise<{ edition: CatalogEdition } | { error: string; code: string }> {
  const db = getDb();
  const sha256 = sha256Buffer(pdfBuffer);

  const duplicate = await db
    .select({ id: catalogEditions.id })
    .from(catalogEditions)
    .where(
      and(
        eq(catalogEditions.pdfSha256, sha256),
        ne(catalogEditions.status, "failed"),
      ),
    )
    .limit(1);

  if (duplicate.length > 0) {
    return {
      error: "Este PDF ya fue importado previamente.",
      code: "DUPLICATE_PDF",
    };
  }

  const pendingLabel = `pending-${Date.now()}`;

  const [placeholder] = await db
    .insert(catalogEditions)
    .values({
      source,
      editionLabel: pendingLabel,
      status: "loaded",
      pdfPath: "",
      pdfSha256: sha256,
    })
    .returning();

  const saved = await saveEditionPdf(placeholder.id, pdfBuffer);

  await db
    .update(catalogEditions)
    .set({ pdfPath: saved.path, updatedAt: new Date() })
    .where(eq(catalogEditions.id, placeholder.id));

  return { edition: { ...placeholder, pdfPath: saved.path } };
}

export async function processEdition(editionId: string): Promise<void> {
  await assertOcrToolsAvailable();
  const db = getDb();
  const edition = await getEdition(editionId);
  if (!edition) throw new Error("Edición no encontrada.");
  if (edition.status === "published" || edition.status === "superseded") {
    throw new Error("No se puede reprocesar una edición publicada o sustituida.");
  }

  const pdfPath = getEditionPdfPath(editionId);
  const totalPages = await getPdfPageCount(pdfPath);

  await db
    .update(catalogEditions)
    .set({
      status: "processing",
      totalPages,
      processedPages: 0,
      processedCount: 0,
      discardedCount: 0,
      warningCount: 0,
      errorCount: 0,
      warnings: [],
      errors: [],
      comparisonNotes: [],
      updatedAt: new Date(),
    })
    .where(eq(catalogEditions.id, editionId));

  await db
    .delete(vehicleRecords)
    .where(eq(vehicleRecords.editionId, editionId));

  let coverText = "";
  try {
    coverText = await ocrPdfCover(pdfPath);
  } catch (err) {
    await failEdition(editionId, [`Error OCR portada: ${String(err)}`]);
    return;
  }

  const detectedLabel = detectEditionLabel(coverText);
  const detectedSource = detectSource(coverText);

  if (!detectedLabel) {
    await failEdition(editionId, [
      "No se detectó la edición (mes/año) en la portada del PDF.",
    ]);
    return;
  }

  if (!validateSourceMatch(edition.source, detectedSource)) {
    await failEdition(editionId, [
      `La portada no coincide con la fuente seleccionada (${edition.source}).`,
    ]);
    return;
  }

  const existingLabel = await db
    .select({ id: catalogEditions.id })
    .from(catalogEditions)
    .where(
      and(
        eq(catalogEditions.source, edition.source),
        eq(catalogEditions.editionLabel, detectedLabel),
        ne(catalogEditions.id, editionId),
        ne(catalogEditions.status, "failed"),
      ),
    )
    .limit(1);

  if (existingLabel.length > 0) {
    await failEdition(editionId, [
      `Ya existe una importación para ${edition.source.toUpperCase()} ${detectedLabel}.`,
    ]);
    return;
  }

  await db
    .update(catalogEditions)
    .set({ editionLabel: detectedLabel, updatedAt: new Date() })
    .where(eq(catalogEditions.id, editionId));

  let processedCount = 0;
  let discardedCount = 0;
  const warnings: string[] = [];
  const errors: string[] = [];

  const maxPagesEnv = process.env.INTERACTIVA_IMPORT_MAX_PAGES;
  const maxPages = maxPagesEnv ? Number.parseInt(maxPagesEnv, 10) : totalPages;
  const pagesToProcess = Number.isFinite(maxPages)
    ? Math.min(totalPages, maxPages)
    : totalPages;

  for (let page = 1; page <= pagesToProcess; page++) {
    try {
      const text = await ocrPdfPage(pdfPath, page);
      const parsed = parseCatalogPage(edition.source, text, page);

      for (const w of parsed.warnings) warnings.push(w);

      if (parsed.records.length > 0) {
        await db.insert(vehicleRecords).values(
          parsed.records.map((r) => ({
            editionId,
            brand: r.brand,
            model: r.model,
            year: r.year,
            version: r.version,
            segment: r.segment,
            attributes: r.attributes,
            economicValues: r.economicValues,
            sourcePage: page,
            rawExcerpt: r.rawExcerpt,
            confidence: r.confidence,
            discardReason: r.discardReason ?? null,
          })),
        );

        processedCount += parsed.records.filter(
          (r) => r.confidence === "interpreted",
        ).length;
        discardedCount += parsed.records.filter(
          (r) => r.confidence === "discarded",
        ).length;
      }
    } catch (err) {
      errors.push(`Página ${page}: ${String(err)}`);
    }

    if (page % 5 === 0 || page === totalPages) {
      await db
        .update(catalogEditions)
        .set({
          processedPages: page,
          processedCount,
          discardedCount,
          warningCount: warnings.length,
          errorCount: errors.length,
          warnings,
          errors,
          updatedAt: new Date(),
        })
        .where(eq(catalogEditions.id, editionId));
    }
  }

  const comparisonNotes = await buildComparisonNotes(
    edition.source,
    detectedLabel,
    processedCount,
    discardedCount,
    editionId,
  );

  await db
    .update(catalogEditions)
    .set({
      status: errors.length > 0 && processedCount === 0 ? "failed" : "processed",
      processedPages: totalPages,
      processedCount,
      discardedCount,
      warningCount: warnings.length,
      errorCount: errors.length,
      warnings,
      errors,
      comparisonNotes,
      updatedAt: new Date(),
    })
    .where(eq(catalogEditions.id, editionId));
}

async function failEdition(editionId: string, errors: string[]) {
  const db = getDb();
  await db
    .update(catalogEditions)
    .set({
      status: "failed",
      errors,
      errorCount: errors.length,
      updatedAt: new Date(),
    })
    .where(eq(catalogEditions.id, editionId));
}

async function buildComparisonNotes(
  source: CatalogSource,
  editionLabel: string,
  processedCount: number,
  discardedCount: number,
  currentId: string,
): Promise<string[]> {
  const db = getDb();
  const notes: string[] = [];

  const [previous] = await db
    .select()
    .from(catalogEditions)
    .where(
      and(
        eq(catalogEditions.source, source),
        eq(catalogEditions.status, "published"),
        ne(catalogEditions.id, currentId),
      ),
    )
    .limit(1);

  if (!previous) {
    notes.push("Primera edición importada para esta fuente; sin comparación previa.");
    return notes;
  }

  const prevProcessed = previous.processedCount;
  if (prevProcessed > 0) {
    const delta = ((processedCount - prevProcessed) / prevProcessed) * 100;
    if (delta <= -25) {
      notes.push(
        `Caída de ${Math.abs(delta).toFixed(0)}% en registros interpretados (${prevProcessed} → ${processedCount}).`,
      );
    } else if (delta >= 50) {
      notes.push(
        `Aumento inusual de ${delta.toFixed(0)}% en registros interpretados (${prevProcessed} → ${processedCount}).`,
      );
    }
  }

  if (discardedCount > previous.discardedCount * 2 && discardedCount > 20) {
    notes.push(
      `Descartados elevados: ${discardedCount} vs ${previous.discardedCount} en edición vigente anterior.`,
    );
  }

  notes.push(`Edición anterior de referencia: ${previous.editionLabel}.`);
  return notes;
}

export async function publishEdition(editionId: string): Promise<void> {
  const db = getDb();
  const edition = await getEdition(editionId);
  if (!edition) throw new Error("Edición no encontrada.");
  if (edition.status !== "processed") {
    throw new Error("Solo se pueden publicar ediciones procesadas.");
  }
  if (edition.processedCount === 0) {
    throw new Error("No hay registros interpretados para publicar.");
  }

  const now = new Date();

  await db
    .update(catalogEditions)
    .set({ status: "superseded", supersededAt: now, updatedAt: now })
    .where(
      and(
        eq(catalogEditions.source, edition.source),
        eq(catalogEditions.status, "published"),
      ),
    );

  await db
    .update(catalogEditions)
    .set({ status: "published", publishedAt: now, updatedAt: now })
    .where(eq(catalogEditions.id, editionId));
}

export async function restoreEdition(editionId: string): Promise<void> {
  const db = getDb();
  const edition = await getEdition(editionId);
  if (!edition) throw new Error("Edición no encontrada.");
  if (edition.status !== "superseded") {
    throw new Error("Solo se pueden restaurar ediciones sustituidas previamente.");
  }

  const now = new Date();
  const current = await getPublishedEdition(edition.source);

  if (current) {
    await db
      .update(catalogEditions)
      .set({ status: "superseded", supersededAt: now, updatedAt: now })
      .where(eq(catalogEditions.id, current.id));
  }

  await db
    .update(catalogEditions)
    .set({
      status: "published",
      publishedAt: now,
      supersededAt: null,
      restoredFromId: current?.id ?? null,
      updatedAt: now,
    })
    .where(eq(catalogEditions.id, editionId));
}

export async function getEditionStats(editionId: string) {
  const db = getDb();
  const [stats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      interpreted: sql<number>`count(*) filter (where ${vehicleRecords.confidence} = 'interpreted')::int`,
    })
    .from(vehicleRecords)
    .where(eq(vehicleRecords.editionId, editionId));
  return stats;
}
