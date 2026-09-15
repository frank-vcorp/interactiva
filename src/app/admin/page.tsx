import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/services/session";

export default async function AdminHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/acceso");
  if (user.role !== "superuser") redirect("/buscar");

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-primary">Administración</h1>
      <p className="mt-2 text-muted-foreground">
        Panel del Superusuario. Las funciones de catálogos, clientes y Mercado
        Pago se completarán en fases posteriores.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { href: "/admin/clientes", title: "Clientes", desc: "Consulta por WhatsApp" },
          { href: "/admin/catalogos", title: "Catálogos", desc: "Importación EBC y Lobato" },
          { href: "/admin/configuracion", title: "Configuración", desc: "Mercado Pago" },
          { href: "/admin/contrasena", title: "Contraseña", desc: "Cambiar contraseña propia" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl border bg-card p-5 transition hover:border-primary/30 hover:shadow-sm"
          >
            <h2 className="font-medium">{item.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
