import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/server/services/session";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user?.role === "client") redirect("/buscar");
  if (user?.role === "superuser") redirect("/admin");

  return (
    <main className="min-h-dvh">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(234,88,12,0.12),_transparent_45%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)]" />
        <div className="relative mx-auto flex min-h-dvh max-w-5xl flex-col justify-center px-6 py-16">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-accent">
            Catálogos automotrices
          </p>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-primary sm:text-5xl">
            Interactiva
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Convierte los catálogos EBC y Lobato en información estructurada,
            buscable y filtrable. Consulta características, valores por fuente
            y ajuste por kilometraje cuando aplique.
          </p>

          <ul className="mt-8 grid gap-3 text-sm text-foreground/90 sm:grid-cols-2">
            <li className="rounded-lg border bg-card/80 px-4 py-3">
              Búsqueda y filtros de vehículos
            </li>
            <li className="rounded-lg border bg-card/80 px-4 py-3">
              EBC y Lobato siempre por separado
            </li>
            <li className="rounded-lg border bg-card/80 px-4 py-3">
              Valores económicos con acceso vigente
            </li>
            <li className="rounded-lg border bg-card/80 px-4 py-3">
              <strong>$50 MXN / 30 días</strong> — acceso completo
            </li>
          </ul>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90">
              <Link href="/registro">Registra tu WhatsApp</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/acceso">Ya tengo cuenta</Link>
            </Button>
          </div>

          <p className="mt-16 text-xs text-muted-foreground/70">
            <Link href="/admin/acceso" className="hover:text-muted-foreground">
              Acceso administrativo
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
