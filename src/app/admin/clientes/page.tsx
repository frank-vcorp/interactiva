import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/services/session";

export default async function AdminClientesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/acceso");
  if (user.role !== "superuser") redirect("/buscar");

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-primary">Clientes</h1>
      <p className="mt-4 rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Búsqueda de clientes por WhatsApp — disponible en Fase 6. No hay
        clientes demo en el sistema.
      </p>
    </main>
  );
}
