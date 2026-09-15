import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentUser } from "@/server/services/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-dvh bg-secondary/30">
      {user?.role === "superuser" && (
        <header className="border-b bg-background">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="font-semibold text-primary">
                Interactiva Admin
              </Link>
              <nav className="hidden gap-4 text-sm sm:flex">
                <Link href="/admin/clientes" className="text-muted-foreground hover:text-foreground">
                  Clientes
                </Link>
                <Link href="/admin/catalogos" className="text-muted-foreground hover:text-foreground">
                  Catálogos
                </Link>
                <Link href="/admin/configuracion" className="text-muted-foreground hover:text-foreground">
                  Configuración
                </Link>
                <Link href="/admin/contrasena" className="text-muted-foreground hover:text-foreground">
                  Contraseña
                </Link>
              </nav>
            </div>
            <LogoutButton />
          </div>
        </header>
      )}
      {children}
    </div>
  );
}
