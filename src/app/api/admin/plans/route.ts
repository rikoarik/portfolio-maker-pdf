import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const plans = await prisma.plan.findMany({
    orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
  });
  return NextResponse.json({ plans });
}
