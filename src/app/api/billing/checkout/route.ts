import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { getSessionUserIdSynced } from "@/lib/project-access";
import { midtransPostJson, midtransDetermineOrigin } from "@/lib/midtrans";

type SnapTransactionResponse = {
  token: string;
  redirect_url: string;
};

export async function POST(req: NextRequest) {
  const userId = await getSessionUserIdSynced();
  if (!userId) {
    return jsonError(401, "unauthorized", "Login required");
  }

  if (!process.env.MIDTRANS_SERVER_KEY) {
    return jsonError(
      503,
      "billing_not_configured",
      "MIDTRANS_SERVER_KEY belum dikonfigurasi di server.",
    );
  }

  let successPath = "/app";
  try {
    const j = (await req.json()) as { successPath?: unknown };
    if (typeof j?.successPath === "string" && j.successPath.startsWith("/")) {
      successPath = j.successPath;
    }
  } catch {
    // default
  }

  const proPlan = await prisma.plan.findUnique({ where: { slug: "pro" } });
  if (!proPlan) {
    return jsonError(503, "billing_not_configured", "Plan Pro belum dibuat di database.");
  }

  const code =
    proPlan.midtransPackageCode?.trim() ||
    process.env.MIDTRANS_PRO_PACKAGE_CODE?.trim() ||
    "pro_default";
  const amountRaw = process.env.MIDTRANS_PRO_AMOUNT ?? "49000";
  const grossAmount = Number.parseInt(amountRaw, 10) || 49000;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  if (!user) {
    return jsonError(401, "unauthorized", "User not found");
  }

  const origin = midtransDetermineOrigin(req);
  const orderId = `pmk-${proPlan.slug}-${userId}-${Date.now()}`;

  const body = {
    transaction_details: {
      order_id: orderId,
      gross_amount: grossAmount,
    },
    item_details: [
      {
        id: code,
        price: grossAmount,
        quantity: 1,
        name: `Pro plan (${code})`,
      },
    ],
    customer_details: {
      email: user.email,
      first_name: user.name ?? undefined,
    },
    callbacks: {
      finish: `${origin}${successPath}?checkout=success`,
    },
  };

  const snap = await midtransPostJson<SnapTransactionResponse>(
    "/snap/v1/transactions",
    body,
  );

  const url = snap.redirect_url;
  if (!url) {
    return jsonError(500, "checkout_failed", "Midtrans tidak mengembalikan redirect_url.");
  }

  return NextResponse.json({ url });
}

