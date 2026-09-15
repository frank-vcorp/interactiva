"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthMode = "register" | "login-client" | "login-superuser";

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "Usuario o contraseña incorrectos.",
  ACCOUNT_IN_USE:
    "Esta cuenta ya está en uso en otro dispositivo. Cierra la otra sesión e intenta de nuevo.",
  WHATSAPP_EXISTS: "Este WhatsApp ya está registrado.",
};

type AuthFormProps = {
  mode: AuthMode;
  identifierLabel: string;
  identifierPlaceholder: string;
  submitLabel: string;
  redirectTo: string;
};

export function AuthForm({
  mode,
  identifierLabel,
  identifierPlaceholder,
  submitLabel,
  redirectTo,
}: AuthFormProps) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint =
      mode === "register" ? "/api/auth/register" : "/api/auth/login";
    const body =
      mode === "register"
        ? { whatsapp: identifier, password }
        : mode === "login-superuser"
          ? { identifier, password, mode: "superuser" }
          : { whatsapp: identifier, password, mode: "client" };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { ok?: boolean; code?: string };

      if (!res.ok || !data.ok) {
        setError(ERROR_MESSAGES[data.code ?? ""] ?? "No se pudo completar la acción.");
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="identifier">{identifierLabel}</Label>
        <Input
          id="identifier"
          name="identifier"
          placeholder={identifierPlaceholder}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          autoComplete={mode === "register" ? "tel" : "username"}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete={
            mode === "register" ? "new-password" : "current-password"
          }
        />
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Procesando…" : submitLabel}
      </Button>
    </form>
  );
}
