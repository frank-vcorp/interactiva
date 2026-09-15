import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatWhatsAppDisplay } from "@/lib/whatsapp";
import { getClientDetail } from "@/server/services/admin-clients";
import { getCurrentUser } from "@/server/services/session";

type Props = { params: Promise<{ id: string }> };

export default async function AdminClienteDetailPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/acceso");
  if (user.role !== "superuser") redirect("/buscar");

  const { id } = await params;
  const client = await getClientDetail(id);
  if (!client) notFound();

  const accessLabel =
    client.accessStatus === "active"
      ? "Vigente"
      : client.accessStatus === "expired"
        ? "Vencido"
        : "Sin acceso";

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <Link href="/admin/clientes" className="text-sm text-muted-foreground hover:text-foreground">
        ← Clientes
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-primary">Cliente</h1>
      <dl className="mt-6 space-y-4 rounded-xl border bg-card p-6">
        <div>
          <dt className="text-sm text-muted-foreground">WhatsApp</dt>
          <dd className="mt-1 font-medium">
            {formatWhatsAppDisplay(client.whatsapp!)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Acceso</dt>
          <dd className="mt-1 font-medium">{accessLabel}</dd>
        </div>
        {client.expiresAt && (
          <div>
            <dt className="text-sm text-muted-foreground">Vencimiento</dt>
            <dd className="mt-1 font-medium">
              {client.expiresAt.toLocaleString("es-MX", {
                timeZone: "America/Mexico_City",
              })}
            </dd>
          </div>
        )}
        <div>
          <dt className="text-sm text-muted-foreground">Renovación automática</dt>
          <dd className="mt-1 font-medium">
            {client.autoRenewalEnabled ? "Activa" : "Desactivada"}
          </dd>
        </div>
      </dl>
    </main>
  );
}
