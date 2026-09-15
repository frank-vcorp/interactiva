import { redirect } from "next/navigation";
import { AdminClientSearch } from "@/components/admin-client-search";
import { getCurrentUser } from "@/server/services/session";

export default async function AdminClientesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/acceso");
  if (user.role !== "superuser") redirect("/buscar");

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-primary">Clientes</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Busca clientes por WhatsApp. Solo consulta; no se modifica vigencia ni
        contraseñas.
      </p>
      <div className="mt-8">
        <AdminClientSearch />
      </div>
    </main>
  );
}
