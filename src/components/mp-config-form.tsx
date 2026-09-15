"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  status: string;
  publicKeyMasked: string;
  accessTokenMasked: string;
  lastError: string | null;
};

export function MpConfigForm({
  status,
  publicKeyMasked,
  accessTokenMasked,
  lastError,
}: Props) {
  const [publicKey, setPublicKey] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/mp-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey, accessToken }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message ?? "No se pudo guardar.");
        return;
      }
      setMessage("Configuración guardada y verificada.");
      setPublicKey("");
      setAccessToken("");
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <dl className="rounded-xl border bg-card p-6 text-sm">
        <div>
          <dt className="text-muted-foreground">Estado</dt>
          <dd className="mt-1 font-medium capitalize">{status}</dd>
        </div>
        <div className="mt-3">
          <dt className="text-muted-foreground">Public Key actual</dt>
          <dd className="mt-1 font-mono">{publicKeyMasked}</dd>
        </div>
        <div className="mt-3">
          <dt className="text-muted-foreground">Access Token actual</dt>
          <dd className="mt-1 font-mono">{accessTokenMasked}</dd>
        </div>
        {lastError && (
          <div className="mt-3">
            <dt className="text-muted-foreground">Último error</dt>
            <dd className="mt-1 text-destructive">{lastError}</dd>
          </div>
        )}
      </dl>

      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-card p-6">
        <div className="space-y-2">
          <Label htmlFor="pk">Public Key</Label>
          <Input id="pk" value={publicKey} onChange={(e) => setPublicKey(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="at">Access Token</Label>
          <Input
            id="at"
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
          />
        </div>
        {message && <p className="text-sm text-primary">{message}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading || !publicKey || !accessToken}>
          {loading ? "Guardando…" : "Guardar configuración"}
        </Button>
      </form>
    </div>
  );
}
