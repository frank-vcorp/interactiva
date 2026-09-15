import { desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { catalogEditions } from "@/server/db/schema";
import { deleteEditionPdf } from "./storage";
import type { CatalogSource } from "./types";

const PIPELINE_STATUSES = new Set(["loaded", "processing", "processed"]);

/**
 * Conserva PDFs por fuente: vigente + anterior + importación en curso (máx. 3).
 * Elimina el resto (fallidas, sustituidas antiguas, duplicadas).
 */
export async function pruneEditionPdfsForSource(
  source: CatalogSource,
): Promise<string[]> {
  const db = getDb();
  const editions = await db
    .select()
    .from(catalogEditions)
    .where(eq(catalogEditions.source, source))
    .orderBy(desc(catalogEditions.createdAt));

  const keepIds = new Set<string>();

  const published = editions.find((e) => e.status === "published");
  if (published) keepIds.add(published.id);

  const latestSuperseded = editions
    .filter((e) => e.status === "superseded")
    .sort(
      (a, b) =>
        (b.supersededAt?.getTime() ?? 0) - (a.supersededAt?.getTime() ?? 0),
    )[0];
  if (latestSuperseded) keepIds.add(latestSuperseded.id);

  const latestPipeline = editions.find((e) => PIPELINE_STATUSES.has(e.status));
  if (latestPipeline) keepIds.add(latestPipeline.id);

  const removed: string[] = [];
  for (const edition of editions) {
    if (keepIds.has(edition.id)) continue;
    const deleted = await deleteEditionPdf(edition.id);
    if (deleted) removed.push(edition.id);
  }

  if (removed.length > 0) {
    console.info("[catalog-storage] prune", { source, removed: removed.length });
  }

  return removed;
}

export async function pruneAllEditionPdfs(): Promise<void> {
  await pruneEditionPdfsForSource("ebc");
  await pruneEditionPdfsForSource("lobato");
}
