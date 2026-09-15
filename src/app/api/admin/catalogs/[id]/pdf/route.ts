import { NextResponse } from "next/server";
import { readEditionPdf } from "@/server/services/catalog/storage";
import { getEdition } from "@/server/services/catalog/import-service";
import { requireSuperuser } from "@/server/services/admin-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await requireSuperuser();
  if (!user) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;
  const edition = await getEdition(id);
  if (!edition) {
    return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  }

  const pdf = await readEditionPdf(id);
  const filename = `${edition.source}-${edition.editionLabel.replace(/\s+/g, "-")}.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=\"${filename}\"`,
    },
  });
}
