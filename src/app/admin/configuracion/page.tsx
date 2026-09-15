import { redirect } from "next/navigation";
import { MpConfigForm } from "@/components/mp-config-form";
import { getMpConfig, maskSecret } from "@/server/services/mercadopago";
import { getCurrentUser } from "@/server/services/session";

export default async function AdminConfiguracionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/acceso");
  if (user.role !== "superuser") redirect("/buscar");

  const config = await getMpConfig();

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold text-primary">Configuración</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Mercado Pago — credenciales protegidas, visibles solo parcialmente.
      </p>
      <div className="mt-8">
        <MpConfigForm
          status={config?.status ?? "missing"}
          publicKeyMasked={maskSecret(config?.publicKey)}
          accessTokenMasked={maskSecret(config?.accessToken)}
          lastError={config?.lastError ?? null}
        />
      </div>
    </main>
  );
}
