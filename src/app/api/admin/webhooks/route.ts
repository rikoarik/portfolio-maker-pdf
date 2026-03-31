import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const take = Math.min(
    100,
    Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 30),
  );

  const events = await prisma.webhookEvent.findMany({
    take,
    orderBy: { processedAt: "desc" },
  });

  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id,
      provider: e.provider,
      eventId: e.eventId,
      payload: e.payload,
      processedAt: e.processedAt.toISOString(),
    })),
  });
}
