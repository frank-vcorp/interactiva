import { notFound, redirect } from "next/navigation";
import { ClientHeader } from "@/components/client-header";
import { VehicleDetailView } from "@/components/vehicle-detail-view";
import { parseVehicleSlug } from "@/lib/vehicle-slug";
import { hasPaidAccess } from "@/server/services/access";
import { getMpPublicStatus } from "@/server/services/mercadopago";
import { getVehicleDetail } from "@/server/services/search";
import { getCurrentUser } from "@/server/services/session";

type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function VehiculoPage({ params, searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/acceso");
  if (user.role === "superuser") redirect("/admin");

  const { slug } = await params;
  const vehicleSlug = slug.join("/");
  const parsed = parseVehicleSlug(vehicleSlug);
  if (!parsed) notFound();

  const detail = await getVehicleDetail(parsed);
  if (!detail) notFound();

  const paid = await hasPaidAccess(user.id);
  const mp = await getMpPublicStatus();

  const sp = await searchParams;
  const backQuery = new URLSearchParams();
  for (const key of ["q", "segment", "brand", "model", "year", "version"]) {
    const val = sp[key];
    if (typeof val === "string" && val) backQuery.set(key, val);
  }
  const backHref = `/buscar?${backQuery.toString()}`;

  const blocks = [];
  if (detail.ebc) {
    blocks.push({
      source: "ebc" as const,
      editionLabel: detail.ebc.edition.editionLabel,
      version: detail.ebc.record.version,
      segment: detail.ebc.record.segment,
      attributes: detail.ebc.record.attributes,
      economicValues: paid ? detail.ebc.record.economicValues : [],
    });
  }
  if (detail.lobato) {
    blocks.push({
      source: "lobato" as const,
      editionLabel: detail.lobato.edition.editionLabel,
      version: detail.lobato.record.version,
      segment: detail.lobato.record.segment,
      attributes: detail.lobato.record.attributes,
      economicValues: paid ? detail.lobato.record.economicValues : [],
    });
  }

  return (
    <main className="min-h-dvh">
      <ClientHeader title="Detalle del vehículo" backHref={backHref} />
      <section className="mx-auto max-w-5xl px-4 py-8">
        <VehicleDetailView
          brand={detail.brand}
          model={detail.model}
          year={detail.year}
          version={detail.version}
          segment={detail.segment}
          blocks={blocks}
          hasPaidAccess={paid}
          mpAvailable={mp.status === "configured"}
          backHref={backHref}
          vehicleParams={vehicleSlug}
        />
      </section>
    </main>
  );
}
