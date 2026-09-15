import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { CatalogEditionActions } from "@/components/catalog-edition-actions";
import { CatalogEditionLive } from "@/components/catalog-edition-live";
import { getCurrentUser } from "@/server/services/session";
import { isEditionOcrStale } from "@/lib/catalog-import-stale";
import {
  getEdition,
  getEditionStats,
  reconcileStaleEdition,
} from "@/server/services/catalog/import-service";
import { editionPdfExists } from "@/server/services/catalog/storage";

type Props = { params: Promise<{ id: string }> };

export default async function AdminCatalogoDetailPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/acceso");
  if (user.role !== "superuser") redirect("/buscar");

  const { id } = await params;
  await reconcileStaleEdition(id);

  const edition = await getEdition(id);
  if (!edition) notFound();

  const stats = await getEditionStats(id);
  const pdfAvailable = await editionPdfExists(id);
  const isStale = isEditionOcrStale(edition.status, edition.updatedAt);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link
        href="/admin/catalogos"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Catálogos
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">
            {edition.source.toUpperCase()} · {edition.editionLabel}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Importación · {stats.interpreted} registros en base
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <CatalogEditionActions
            editionId={id}
            status={edition.status}
            isStale={isStale}
            pdfAvailable={pdfAvailable}
          />
          <a
            href={`/api/admin/catalogs/${id}/pdf`}
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            Ver PDF original
          </a>
        </div>
      </div>

      <div className="mt-8">
        <CatalogEditionLive
          editionId={id}
          initial={{ edition, stats }}
        />
      </div>
    </main>
  );
}
