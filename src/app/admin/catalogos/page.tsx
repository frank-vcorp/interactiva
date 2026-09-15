import Link from "next/link";
import { redirect } from "next/navigation";
import { CatalogImportForm } from "@/components/catalog-import-form";
import { getCurrentUser } from "@/server/services/session";
import { listEditions } from "@/server/services/catalog/import-service";

const STATUS_LABEL: Record<string, string> = {
  loaded: "Cargada",
  processing: "Procesando",
  processed: "Lista para revisión",
  published: "Vigente",
  superseded: "Sustituida",
  failed: "Fallida",
};

export default async function AdminCatalogosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/acceso");
  if (user.role !== "superuser") redirect("/buscar");

  const editions = await listEditions();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-primary">Catálogos</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Importa EBC y Lobato. Cada fuente mantiene su edición vigente de forma
        independiente.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <CatalogImportForm />

        <section className="rounded-xl border bg-card p-6">
          <h2 className="font-medium">Historial de importaciones</h2>
          {editions.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No hay importaciones todavía.
            </p>
          ) : (
            <ul className="mt-4 divide-y">
              {editions.map((edition) => (
                <li key={edition.id} className="py-3">
                  <Link
                    href={`/admin/catalogos/${edition.id}`}
                    className="block hover:text-primary"
                  >
                    <p className="font-medium">
                      {edition.source.toUpperCase()} · {edition.editionLabel}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {STATUS_LABEL[edition.status] ?? edition.status} ·{" "}
                      {edition.processedCount} interpretados ·{" "}
                      {edition.discardedCount} descartados
                      {edition.status === "loaded" && (
                        <span className="text-amber-700">
                          {" "}
                          · OCR pendiente — abre y pulsa Reintentar OCR
                        </span>
                      )}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
