import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ClientHeader } from "@/components/client-header";
import { VehicleSearch } from "@/components/vehicle-search";
import { getCurrentUser } from "@/server/services/session";

export default async function BuscarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/acceso");
  if (user.role === "superuser") redirect("/admin");

  return (
    <main className="min-h-dvh">
      <ClientHeader title="Buscar vehículos" backHref="/" backLabel="Inicio" />
      <section className="mx-auto max-w-5xl px-4 py-8">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando…</p>}>
          <VehicleSearch />
        </Suspense>
      </section>
    </main>
  );
}
