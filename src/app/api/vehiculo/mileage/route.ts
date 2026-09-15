import { NextResponse } from "next/server";
import { z } from "zod";
import { hasPaidAccess } from "@/server/services/access";
import { calculateMileageAdjustment } from "@/server/services/mileage";
import { getVehicleDetail } from "@/server/services/search";
import { getCurrentUser } from "@/server/services/session";

const schema = z.object({
  mileage: z.number().int().min(0),
  source: z.enum(["ebc", "lobato"]),
  vehicleParams: z.string(),
});

import { parseVehicleSlug } from "@/lib/vehicle-slug";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "client") {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }

  if (!(await hasPaidAccess(user.id))) {
    return NextResponse.json({ ok: false, code: "FORBIDDEN" }, { status: 403 });
  }

  const body = schema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });
  }

  const params = parseVehicleSlug(body.data.vehicleParams);
  if (!params) {
    return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  }

  const detail = await getVehicleDetail(params);
  if (!detail) {
    return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  }

  const block =
    body.data.source === "ebc" ? detail.ebc : detail.lobato;
  const values = block?.record.economicValues ?? [];

  const result = calculateMileageAdjustment(
    values,
    body.data.mileage,
    body.data.source,
  );

  return NextResponse.json({ ok: true, ...result });
}
