import { redirect } from "next/navigation";
import { AccountPanel } from "@/components/account-panel";
import { ClientHeader } from "@/components/client-header";
import { formatWhatsAppDisplay } from "@/lib/whatsapp";
import { getAccessInfo } from "@/server/services/access";
import { getMpPublicStatus } from "@/server/services/mercadopago";
import { getCurrentUser } from "@/server/services/session";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CuentaPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/acceso");
  if (user.role === "superuser") redirect("/admin");

  const access = await getAccessInfo(user.id);
  const mp = await getMpPublicStatus();
  const sp = await searchParams;
  const pago = typeof sp.pago === "string" ? sp.pago : null;

  const paymentMessage =
    pago === "ok"
      ? "Si tu pago fue aprobado, tu acceso se activará en breve."
      : pago === "pending"
        ? "Pago pendiente. OXXO y otros métodos pueden tardar en confirmarse."
        : pago === "error"
          ? "El pago no se completó. Puedes intentar de nuevo."
          : null;

  return (
    <main className="min-h-dvh">
      <ClientHeader title="Tu cuenta" />
      <section className="mx-auto max-w-lg px-4 py-8">
        <AccountPanel
          whatsappDisplay={
            user.whatsapp ? formatWhatsAppDisplay(user.whatsapp) : "—"
          }
          accessStatus={access.status}
          expiresAt={access.expiresAt?.toISOString() ?? null}
          autoRenewalEnabled={access.autoRenewalEnabled}
          mpStatus={mp.status}
          paymentMessage={paymentMessage}
        />
      </section>
    </main>
  );
}
