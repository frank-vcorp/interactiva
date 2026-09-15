import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/services/session";

export default async function AdminConfiguracionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/acceso");
  if (user.role !== "superuser") redirect("/buscar");

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-primary">Configuración</h1>
      <p className="mt-4 rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Mercado Pago — disponible en Fase 5.
      </p>
    </main>
  );
}
