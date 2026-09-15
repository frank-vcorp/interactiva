import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentUser } from "@/server/services/session";

export default async function BuscarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/acceso");
  if (user.role === "superuser") redirect("/admin");

  return (
    <main className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Interactiva
            </p>
            <h1 className="text-lg font-semibold text-primary">Buscar vehículos</h1>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/cuenta"
              className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              Cuenta
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-xl border bg-card p-8 text-center">
          <h2 className="text-xl font-medium text-foreground">
            Aún no hay catálogos publicados
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            El buscador estará disponible cuando el Superusuario importe y publique
            las ediciones vigentes de EBC y Lobato. Puedes registrarte y acceder
            desde ya; la búsqueda se habilitará en la Fase 3.
          </p>
        </div>
      </section>
    </main>
  );
}
