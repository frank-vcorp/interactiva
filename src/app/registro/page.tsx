import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/server/services/session";

export default async function RegistroPage() {
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
      <h1 className="text-2xl font-semibold text-primary">Registra tu WhatsApp</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Solo necesitas tu WhatsApp y una contraseña. Crear cuenta no incluye
        acceso pagado.
      </p>
      <div className="mt-8">
        <AuthForm
          mode="register"
          identifierLabel="WhatsApp"
          identifierPlaceholder="10 dígitos, ej. 5512345678"
          submitLabel="Crear cuenta"
          redirectTo="/buscar"
        />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/acceso" className="text-primary underline-offset-4 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </main>
  );
}
