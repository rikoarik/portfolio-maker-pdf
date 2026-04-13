import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { getSessionUserIdSynced } from "@/lib/project-access";
import { midtransPostJson, midtransDetermineOrigin } from "@/lib/midtrans";

type SnapTransactionResponse = {
  token: string;
  redirect_url: string;
};

type CheckoutProvider = "auto" | "stripe" | "midtrans";

export async function POST(req: NextRequest) {
  const userId = await getSessionUserIdSynced();
  if (!userId) {
    return jsonError(401, "unauthorized", "Login required");
  }

  let successPath = "/app";
  let provider: CheckoutProvider = "auto";
  try {
    const j = (await req.json()) as {
      successPath?: unknown;
      provider?: unknown;
    };
    if (typeof j?.successPath === "string" && j.successPath.startsWith("/")) {
      successPath = j.successPath;
    }
    if (
      j?.provider === "auto" ||
      j?.provider === "stripe" ||
      j?.provider === "midtrans"
    ) {
      provider = j.provider;
    }
  } catch {
    // default
  }

  const proPlan = await prisma.plan.findUnique({ where: { slug: "pro" } });
  if (!proPlan) {
    return jsonError(503, "billing_not_configured", "Plan Pro belum dibuat di database.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  if (!user) {
    return jsonError(401, "unauthorized", "User not found");
  }

  const origin = midtransDetermineOrigin(req);

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const stripePriceId = proPlan.stripePriceId?.trim();
  const stripeEnabled = !!stripeKey && !!stripePriceId;
  const shouldUseStripe =
    provider === "stripe" || (provider === "auto" && stripeEnabled);

  if (shouldUseStripe) {
    if (!stripeKey || !stripePriceId) {
      return jsonError(
        503,
        "billing_not_configured",
        "Stripe belum dikonfigurasi lengkap untuk paket Pro.",
      );
    }
    const stripe = new Stripe(stripeKey);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      success_url: `${origin}${successPath}?checkout=success&provider=stripe`,
      cancel_url: `${origin}/pricing?checkout=cancelled&provider=stripe`,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      customer_email: user.email,
      client_reference_id: userId,
      metadata: { userId },
      allow_promotion_codes: true,
    });
    if (!session.url) {
      return jsonError(500, "checkout_failed", "Stripe tidak mengembalikan URL checkout.");
    }
    return NextResponse.json({ url: session.url, provider: "stripe" });
  }

  if (!process.env.MIDTRANS_SERVER_KEY) {
    return jsonError(
      503,
      "billing_not_configured",
      "Midtrans belum dikonfigurasi di server.",
    );
  }

  const code =
    proPlan.midtransPackageCode?.trim() ||
    process.env.MIDTRANS_PRO_PACKAGE_CODE?.trim() ||
    "pro_default";
  const amountRaw = process.env.MIDTRANS_PRO_AMOUNT ?? "49000";
  const grossAmount = Number.parseInt(amountRaw, 10) || 49000;
  const orderId = `pmk-${proPlan.slug}-${userId}-${Date.now()}`;

  const snap = await midtransPostJson<SnapTransactionResponse>("/snap/v1/transactions", {
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
      finish: `${origin}${successPath}?checkout=success&provider=midtrans`,
    },
  });

  const url = snap.redirect_url;
  if (!url) {
    return jsonError(500, "checkout_failed", "Midtrans tidak mengembalikan redirect_url.");
  }

  return NextResponse.json({ url, provider: "midtrans" });
}

