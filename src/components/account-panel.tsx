"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PRODUCT_PRICE_MXN, ACCESS_DAYS } from "@/lib/product";

type Props = {
  whatsappDisplay: string;
  accessStatus: "none" | "active" | "expired";
  expiresAt: string | null;
  autoRenewalEnabled: boolean;
  mpStatus: "configured" | "missing" | "error";
  paymentMessage?: string | null;
};

export function AccountPanel({
  whatsappDisplay,
  accessStatus,
  expiresAt,
  autoRenewalEnabled,
  mpStatus,
  paymentMessage,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [renewal, setRenewal] = useState(autoRenewalEnabled);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/checkout", { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; initPoint?: string; message?: string };
      if (!res.ok || !data.ok || !data.initPoint) {
        setError(data.message ?? "No se pudo iniciar el pago.");
        return;
      }
      window.location.href = data.initPoint;
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleRenewal() {
    const res = await fetch("/api/cuenta/renewal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !renewal }),
    });
    if (res.ok) setRenewal(!renewal);
  }

  const accessLabel =
    accessStatus === "active"
      ? "Vigente"
      : accessStatus === "expired"
        ? "Vencido"
        : "Sin acceso";

  return (
    <div className="space-y-6">
      {paymentMessage && (
        <p className="rounded-lg border bg-secondary/50 p-3 text-sm">{paymentMessage}</p>
      )}

      <dl className="space-y-4 rounded-xl border bg-card p-6">
        <div>
          <dt className="text-sm text-muted-foreground">WhatsApp</dt>
          <dd className="mt-1 font-medium">{whatsappDisplay}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Acceso</dt>
          <dd className="mt-1 font-medium">{accessLabel}</dd>
        </div>
        {expiresAt && (
          <div>
            <dt className="text-sm text-muted-foreground">Vence</dt>
            <dd className="mt-1 font-medium">
              {new Date(expiresAt).toLocaleString("es-MX", {
                timeZone: "America/Mexico_City",
              })}
            </dd>
          </div>
        )}
        <div>
          <dt className="text-sm text-muted-foreground">Renovación automática</dt>
          <dd className="mt-1 flex items-center gap-3">
            <span className="font-medium">{renewal ? "Activa" : "Desactivada"}</span>
            <Button type="button" variant="outline" size="sm" onClick={toggleRenewal}>
              {renewal ? "Desactivar" : "Activar"}
            </Button>
          </dd>
        </div>
      </dl>

      <div className="rounded-xl border border-accent/30 bg-accent/5 p-6">
        <p className="font-medium">
          ${PRODUCT_PRICE_MXN} MXN / {ACCESS_DAYS} días
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Acceso completo a valores económicos y cálculos por kilometraje cuando
          aplique.
        </p>
        {mpStatus === "configured" ? (
          <Button className="mt-4" onClick={checkout} disabled={loading}>
            {loading ? "Redirigiendo…" : "Contratar o renovar"}
          </Button>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Pagos temporalmente no disponibles (Mercado Pago sin configurar).
          </p>
        )}
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
