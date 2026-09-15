import { NextResponse } from "next/server";
import { processPaymentNotification } from "@/server/services/mercadopago";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    type?: string;
    data?: { id?: string };
  };

  if (body.type === "payment" && body.data?.id) {
    await processPaymentNotification(String(body.data.id));
  }

  return NextResponse.json({ ok: true });
}
