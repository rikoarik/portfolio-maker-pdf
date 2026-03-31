import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const take = Math.min(
    200,
    Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 50),
  );

  const rows = await prisma.auditLog.findMany({
    take,
    orderBy: { createdAt: "desc" },
    include: {
      actor: { select: { email: true } },
    },
  });

  return NextResponse.json({
    entries: rows.map((r) => ({
      id: r.id,
      action: r.action,
      actorUserId: r.actorUserId,
      actorEmail: r.actor?.email ?? null,
      targetUserId: r.targetUserId,
      metadata: r.metadata,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
