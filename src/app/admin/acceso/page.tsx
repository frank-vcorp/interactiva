import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/server/services/session";

export default async function AdminAccesoPage() {
  const user = await getCurrentUser();
  if (user?.role === "superuser") redirect("/admin");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-semibold text-primary">Acceso administrativo</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Superusuario únicamente.
      </p>
      <div className="mt-8">
        <AuthForm
          mode="login-superuser"
          identifierLabel="Usuario"
          identifierPlaceholder="Vectoria"
          submitLabel="Entrar"
          redirectTo="/admin"
        />
      </div>
      <p className="mt-6 text-center text-sm">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          Volver al inicio
        </Link>
      </p>
    </main>
  );
}
