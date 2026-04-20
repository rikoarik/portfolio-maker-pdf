import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

function verifySignature(body: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return false;
  const raw = `${body.order_id}${body.status_code}${body.gross_amount}${serverKey}`;
  const expected = crypto.createHash("sha512").update(raw).digest("hex");
  return expected === body.signature_key;
}

type MidtransNotification = {
  order_id: string;
  status_code: string;
  gross_amount: string;
  transaction_status: string;
  signature_key: string;
};

export async function POST(req: Request) {
  if (!process.env.MIDTRANS_SERVER_KEY) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const text = await req.text();
  let body: MidtransNotification;
  try {
    body = JSON.parse(text) as MidtransNotification;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (
    !body.order_id ||
    !body.status_code ||
    !body.gross_amount ||
    !body.signature_key
  ) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  if (!verifySignature(body)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  try {
    await prisma.webhookEvent.create({
      data: {
        provider: "midtrans",
        eventId: body.order_id,
        payload: body as unknown as Prisma.InputJsonValue,
      },
    });
  } catch {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const [prefix, planSlug, userId] = body.order_id.split("-");
  if (prefix === "pmk" && planSlug && userId) {
    const txStatus = body.transaction_status;
    const active =
      txStatus === "settlement" || txStatus === "capture" || txStatus === "success";

    const proPlan = await prisma.plan.findFirst({
      where: { slug: planSlug },
    });
    const freePlan = await prisma.plan.findUnique({ where: { slug: "free" } });

    if (active && proPlan) {
      const days = proPlan.periodDays || 30;
      const now = new Date();
      const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      await prisma.user.update({
        where: { id: userId },
        data: {
          tier: "PRO",
          planId: proPlan.id,
          currentPeriodEnd: until,
        },
      });
    } else if (!active && freePlan) {
      await prisma.user.updateMany({
        where: { id: userId },
        data: {
          tier: "FREE",
          planId: freePlan.id,
          currentPeriodEnd: null,
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}

