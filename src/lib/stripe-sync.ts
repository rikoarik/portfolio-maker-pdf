import { prisma } from "@/lib/db";

export async function syncUserFromStripeSubscription(opts: {
  userId: string;
  customerId: string;
  priceId: string | null;
  status: string;
  currentPeriodEnd: Date | null;
}): Promise<void> {
  const free = await prisma.plan.findUnique({ where: { slug: "free" } });
  const active =
    (opts.status === "active" || opts.status === "trialing") &&
    opts.currentPeriodEnd != null &&
    opts.currentPeriodEnd.getTime() > Date.now();

  let planId = free?.id ?? null;
  let tier = "FREE";

  if (active) {
    if (opts.priceId) {
      const byPrice = await prisma.plan.findFirst({
        where: { stripePriceId: opts.priceId, active: true },
      });
      const pro = byPrice ?? (await prisma.plan.findUnique({ where: { slug: "pro" } }));
      if (pro) {
        planId = pro.id;
        tier = "PRO";
      }
    } else {
      const pro = await prisma.plan.findUnique({ where: { slug: "pro" } });
      if (pro) {
        planId = pro.id;
        tier = "PRO";
      }
    }
  }

  await prisma.user.update({
    where: { id: opts.userId },
    data: {
      paymentCustomerId: opts.customerId,
      tier,
      planId,
      currentPeriodEnd: opts.currentPeriodEnd,
    },
  });
}

export async function downgradeStripeCustomer(customerId: string): Promise<void> {
  const free = await prisma.plan.findUnique({ where: { slug: "free" } });
  await prisma.user.updateMany({
    where: { paymentCustomerId: customerId },
    data: {
      tier: "FREE",
      planId: free?.id ?? undefined,
      currentPeriodEnd: null,
    },
  });
}
