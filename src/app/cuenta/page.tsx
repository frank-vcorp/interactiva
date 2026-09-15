import Link from "next/link";
import { redirect } from "next/navigation";
import { formatWhatsAppDisplay } from "@/lib/whatsapp";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentUser } from "@/server/services/session";

export default async function CuentaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/acceso");
  if (user.role === "superuser") redirect("/admin");

  return (
    <main className="min-h-dvh">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/buscar" className="text-sm text-primary hover:underline">
            ← Buscar
          </Link>
          <LogoutButton />
        </div>
      </header>

      <section className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-2xl font-semibold text-primary">Tu cuenta</h1>
        <dl className="mt-6 space-y-4 rounded-xl border bg-card p-6">
          <div>
            <dt className="text-sm text-muted-foreground">WhatsApp</dt>
            <dd className="mt-1 font-medium">
              {user.whatsapp ? formatWhatsAppDisplay(user.whatsapp) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Acceso</dt>
            <dd className="mt-1 font-medium">Sin vigencia</dd>
          </div>
        </dl>

        <div className="mt-6 rounded-xl border border-accent/30 bg-accent/5 p-6">
          <p className="font-medium text-foreground">$50 MXN / 30 días</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Contrata acceso completo a valores económicos y cálculos por
            kilometraje. Mercado Pago se integrará en la Fase 5.
          </p>
        </div>
      </section>
    </main>
  );
}
