"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PRODUCT_PRICE_MXN } from "@/lib/product";

type EconomicValue = { concept: string; amount: number; currency: string };

type SourceBlock = {
  source: "ebc" | "lobato";
  editionLabel: string;
  version: string | null;
  segment: string | null;
  attributes: Record<string, string>;
  economicValues: EconomicValue[];
};

type Props = {
  brand: string | null;
  model: string | null;
  year: number | null;
  version: string | null;
  segment: string | null;
  blocks: SourceBlock[];
  hasPaidAccess: boolean;
  mpAvailable: boolean;
  backHref: string;
  vehicleParams: string;
};

export function VehicleDetailView({
  brand,
  model,
  year,
  version,
  segment,
  blocks,
  hasPaidAccess,
  mpAvailable,
  backHref,
  vehicleParams,
}: Props) {
  const [mileage, setMileage] = useState("");
  const [mileageResult, setMileageResult] = useState<string | null>(null);

  async function calcMileage(source: "ebc" | "lobato") {
    const res = await fetch("/api/vehiculo/mileage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mileage: Number.parseInt(mileage, 10),
        source,
        vehicleParams,
      }),
    });
    const data = (await res.json()) as { message?: string };
    setMileageResult(data.message ?? "Sin respuesta.");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-primary">
          {[brand, model, year].filter(Boolean).join(" · ")}
        </h2>
        {version && (
          <p className="mt-2 text-muted-foreground">{version}</p>
        )}
        {segment && (
          <p className="mt-1 text-sm text-muted-foreground">{segment}</p>
        )}
      </div>

      {!hasPaidAccess && (
        <div className="rounded-xl border border-accent/40 bg-accent/5 p-4">
          <p className="font-medium">${PRODUCT_PRICE_MXN} MXN / 30 días</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Contrata acceso para ver valores económicos y cálculos.
          </p>
          {mpAvailable && (
            <Button asChild size="sm" className="mt-3">
              <Link href="/cuenta">Ir a cuenta</Link>
            </Button>
          )}
        </div>
      )}

      {blocks.map((block) => (
        <section key={block.source} className="rounded-xl border bg-card p-5">
          <h3 className="font-medium uppercase tracking-wide text-sm text-muted-foreground">
            {block.source === "ebc" ? "EBC" : "Lobato"} — {block.editionLabel}
          </h3>
          {block.version && (
            <p className="mt-2 text-sm">{block.version}</p>
          )}

          {Object.keys(block.attributes).length > 0 && (
            <dl className="mt-4 grid gap-2 sm:grid-cols-2">
              {Object.entries(block.attributes).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs capitalize text-muted-foreground">{k}</dt>
                  <dd className="text-sm">{v}</dd>
                </div>
              ))}
            </dl>
          )}

          {hasPaidAccess ? (
            block.economicValues.length > 0 ? (
              <dl className="mt-4 space-y-2">
                {block.economicValues.map((ev) => (
                  <div key={ev.concept} className="flex justify-between text-sm">
                    <dt>{ev.concept}</dt>
                    <dd className="font-medium">
                      ${ev.amount.toLocaleString("es-MX")} {ev.currency}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Sin valores económicos en esta fuente para este registro.
              </p>
            )
          ) : (
            block.economicValues.length > 0 && (
              <p className="mt-4 text-sm text-muted-foreground">
                Valores económicos disponibles con acceso vigente.
              </p>
            )
          )}
        </section>
      ))}

      {hasPaidAccess && (
        <section className="rounded-xl border bg-card p-5">
          <h3 className="font-medium">Kilometraje</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Solo para esta consulta; no se guarda en tu cuenta.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <Label htmlFor="km">Kilometraje actual</Label>
              <Input
                id="km"
                type="number"
                min={0}
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={!mileage}
              onClick={() => calcMileage(blocks[0]?.source ?? "ebc")}
            >
              Calcular
            </Button>
          </div>
          {mileageResult && (
            <p className="mt-3 text-sm text-muted-foreground">{mileageResult}</p>
          )}
        </section>
      )}

      <Link href={backHref} className="text-sm text-primary hover:underline">
        ← Regresar a búsqueda
      </Link>
    </div>
  );
}
