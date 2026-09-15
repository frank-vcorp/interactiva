import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/server/services/session";

export default async function AccesoPage() {
  const user = await getCurrentUser();
  if (user?.role === "client") redirect("/buscar");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <Link
        href="/"
        className="mb-8 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Interactiva
      </Link>
      <h1 className="text-2xl font-semibold text-primary">Inicia sesión</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Accede con tu WhatsApp y contraseña.
      </p>
      <div className="mt-8">
        <AuthForm
          mode="login-client"
          identifierLabel="WhatsApp"
          identifierPlaceholder="10 dígitos"
          submitLabel="Entrar"
          redirectTo="/buscar"
        />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="text-primary underline-offset-4 hover:underline">
          Registra tu WhatsApp
        </Link>
      </p>
    </main>
  );
}
