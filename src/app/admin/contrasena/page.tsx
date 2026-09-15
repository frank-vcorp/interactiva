import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/change-password-form";
import { getCurrentUser } from "@/server/services/session";

export default async function AdminContrasenaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/acceso");
  if (user.role !== "superuser") redirect("/buscar");

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold text-primary">Cambiar contraseña</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Actualiza la contraseña del Superusuario.
      </p>
      <div className="mt-8">
        <ChangePasswordForm />
      </div>
    </main>
  );
}
