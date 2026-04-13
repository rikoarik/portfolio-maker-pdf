import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { getSessionUserIdSynced } from "@/lib/project-access";
import { midtransDetermineOrigin } from "@/lib/midtrans";

export async function POST(req: NextRequest) {
  const userId = await getSessionUserIdSynced();
  if (!userId) return jsonError(401, "unauthorized", "Login required");

  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    return jsonError(503, "billing_not_configured", "Stripe belum dikonfigurasi di server.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { paymentCustomerId: true },
  });
  if (!user?.paymentCustomerId) {
    return jsonError(
      400,
      "customer_not_found",
      "Akun ini belum memiliki customer Stripe aktif.",
    );
  }

  const origin = midtransDetermineOrigin(req);
  const stripe = new Stripe(apiKey);
  const session = await stripe.billingPortal.sessions.create({
    customer: user.paymentCustomerId,
    return_url: `${origin}/app/settings`,
  });

  return NextResponse.json({ url: session.url });
}
