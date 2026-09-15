import { and, desc, eq, ne, sql } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import {
  catalogEditions,
  vehicleRecords,
  type CatalogEdition,
} from "@/server/db/schema";
import {
  detectEditionFromFilename,
  detectEditionLabel,
  detectSource,
  detectSourceFromFilename,
  validateSourceMatch,
} from "./detect-edition";
import { ocrPdfPage, getPdfPageCount, assertOcrToolsAvailable } from "./ocr";
import { parseCatalogPage } from "./parsers";
import {
  parseEbcPage,
  type EbcParseContext,
} from "./parsers/ebc";
import {
  CANCEL_EDITION_MESSAGE,
  STALE_EDITION_MESSAGE,
  isEditionOcrStale,
} from "@/lib/catalog-import-stale";
import { pruneEditionPdfsForSource } from "./prune-storage";
import {
  editionPdfExists,
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

export type ImportUploadResult =
  | { edition: CatalogEdition; reused?: boolean }
  | { error: string; code: string; existingEditionId?: string };

const RETRIABLE_IMPORT_STATUSES = new Set(["loaded", "processing", "failed"]);

export async function createImportFromUpload(
  source: CatalogSource,
  pdfBuffer: Buffer,
): Promise<ImportUploadResult> {
  const db = getDb();
  const sha256 = sha256Buffer(pdfBuffer);

  const [existing] = await db
    .select()
    .from(catalogEditions)
    .where(eq(catalogEditions.pdfSha256, sha256))
    .orderBy(desc(catalogEditions.createdAt))
    .limit(1);

  if (existing) {
    if (RETRIABLE_IMPORT_STATUSES.has(existing.status)) {
      const saved = await saveEditionPdf(existing.id, pdfBuffer);
      await db
        .update(catalogEditions)
        .set({
          source,
          pdfPath: saved.path,
          pdfSha256: sha256,
          status: "loaded",
          processedPages: 0,
          processedCount: 0,
          discardedCount: 0,
          warningCount: 0,
          errorCount: 0,
          warnings: [],
          errors: [],
          comparisonNotes: [],
          totalPages: null,
          updatedAt: new Date(),
        })
        .where(eq(catalogEditions.id, existing.id));

      await pruneEditionPdfsForSource(source);

      return {
        edition: {
          ...existing,
          source,
          pdfPath: saved.path,
          status: "loaded",
        },
        reused: true,
      };
    }

    return {
      error:
        "Este PDF ya fue importado y procesado. Abre la importación existente o usa otra edición.",
      code: "DUPLICATE_PDF",
      existingEditionId: existing.id,
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

  await pruneEditionPdfsForSource(source);

  return { edition: { ...placeholder, pdfPath: saved.path } };
}

export type ProcessEditionHints = {
  originalFilename?: string;
};

export async function queueEditionProcessing(
  editionId: string,
  hints?: ProcessEditionHints,
): Promise<void> {
  void processEdition(editionId, hints).catch(async (err) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[catalog-import] background process failed", {
      editionId,
      message,
    });
    await markEditionFailed(editionId, [message]);
  });
}

export async function reconcileStaleEdition(editionId: string): Promise<boolean> {
  const edition = await getEdition(editionId);
  if (!edition || !isEditionOcrStale(edition.status, edition.updatedAt)) {
    return false;
  }
  await markEditionFailed(editionId, [STALE_EDITION_MESSAGE]);
  return true;
}

export async function cancelEditionProcessing(editionId: string): Promise<void> {
  const edition = await getEdition(editionId);
  if (!edition) throw new Error("Edición no encontrada.");
  if (!["loaded", "processing"].includes(edition.status)) {
    throw new Error("Solo se puede detener importaciones en curso.");
  }
  await markEditionFailed(editionId, [CANCEL_EDITION_MESSAGE]);
}

export async function retryEditionProcessing(editionId: string): Promise<void> {
  const edition = await getEdition(editionId);
  if (!edition) throw new Error("Edición no encontrada.");
  if (!RETRIABLE_IMPORT_STATUSES.has(edition.status)) {
    throw new Error(
      "Solo se puede reintentar importaciones en estado cargada, procesando o fallida.",
    );
  }

  if (!(await editionPdfExists(editionId))) {
    throw new Error(
      "El PDF no está en el servidor (puede haberse perdido en un redeploy). Vuelve a subirlo desde Catálogos.",
    );
  }

  const db = getDb();
  await db
    .update(catalogEditions)
    .set({
      status: "loaded",
      processedPages: 0,
      processedCount: 0,
      discardedCount: 0,
      warningCount: 0,
      errorCount: 0,
      warnings: [],
      errors: [],
      comparisonNotes: [],
      totalPages: null,
      updatedAt: new Date(),
    })
    .where(eq(catalogEditions.id, editionId));

  queueEditionProcessing(editionId);
}

export async function processEdition(
  editionId: string,
  hints?: ProcessEditionHints,
): Promise<void> {
  const db = getDb();
  const edition = await getEdition(editionId);
  if (!edition) throw new Error("Edición no encontrada.");
  if (edition.status === "published" || edition.status === "superseded") {
    throw new Error("No se puede reprocesar una edición publicada o sustituida.");
  }

  await db
    .update(catalogEditions)
    .set({
      status: "processing",
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

  try {
    await assertOcrToolsAvailable();

    const pdfPath = getEditionPdfPath(editionId);
    const totalPages = await getPdfPageCount(pdfPath);

    await db
      .update(catalogEditions)
      .set({ totalPages, updatedAt: new Date() })
      .where(eq(catalogEditions.id, editionId));

    await db
      .delete(vehicleRecords)
      .where(eq(vehicleRecords.editionId, editionId));

    let coverText = "";
    let detectedLabel: string | null = null;
    let detectedSource: ReturnType<typeof detectSource> = null;

    for (let page = 1; page <= 5 && !detectedLabel; page++) {
      try {
        coverText = await ocrPdfPage(pdfPath, page);
        detectedLabel = detectEditionLabel(coverText);
        detectedSource = detectSource(coverText);
      } catch (err) {
        if (page === 1) {
          await markEditionFailed(editionId, [`Error OCR portada: ${String(err)}`]);
          return;
        }
      }
    }

    if (!detectedLabel && hints?.originalFilename) {
      detectedLabel = detectEditionFromFilename(hints.originalFilename);
      detectedSource = detectSourceFromFilename(hints.originalFilename);
    }

    if (!detectedLabel) {
      await markEditionFailed(editionId, [
        "No se detectó la edición (mes/año) en las primeras páginas ni en el nombre del archivo.",
      ]);
      return;
    }

    if (
      detectedSource &&
      !validateSourceMatch(edition.source, detectedSource)
    ) {
      await markEditionFailed(editionId, [
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
    await markEditionFailed(editionId, [
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

  let ebcContext: EbcParseContext = {
    brand: null,
    year: null,
    group: null,
  };

  for (let page = 1; page <= pagesToProcess; page++) {
    try {
      const text = await ocrPdfPage(pdfPath, page);
      let parsed;
      if (edition.source === "ebc") {
        const ebcParsed = parseEbcPage(text, page, ebcContext);
        ebcContext = ebcParsed.context;
        parsed = ebcParsed;
      } else {
        parsed = parseCatalogPage(edition.source, text, page);
      }

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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[catalog-import] processEdition", editionId, message);
    await markEditionFailed(editionId, [message]);
    throw err;
  }
}

export async function markEditionFailed(editionId: string, errors: string[]) {
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

  await pruneEditionPdfsForSource(edition.source);
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

  await pruneEditionPdfsForSource(edition.source);
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
