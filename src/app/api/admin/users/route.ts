import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
  const take = Math.min(
    50,
    Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 20),
  );

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    take,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      tier: true,
      planId: true,
      paymentCustomerId: true,
      currentPeriodEnd: true,
      aiUsageCount: true,
      aiApiKey: true,
      createdAt: true,
      plan: { select: { id: true, slug: true, name: true } },
    },
  });

  return NextResponse.json({ users });
}
