import { NextResponse } from "next/server";
import { ensurePrismaUser } from "@/lib/auth/sync-user";
import { prisma } from "@/lib/db";
import { dbUnreachableResponse } from "@/lib/prisma-errors";
import {
  getUsageSnapshot,
} from "@/lib/quota";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ user: null });
  }
  try {
    await ensurePrismaUser(user);
    const row = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        tier: true,
        role: true,
        aiUsageCount: true,
        paymentCustomerId: true,
        plan: {
          select: {
            slug: true,
            name: true,
            maxProjects: true,
            maxScreenshotsPerProject: true,
            maxAiAnalysesPerPeriod: true,
            maxPdfExportsPerPeriod: true,
          },
        },
      },
    });
    if (!row) {
      return NextResponse.json({ user: null });
    }
    const usage = await getUsageSnapshot(user.id);
    return NextResponse.json({
      user: {
        ...row,
        usageThisMonth: usage,
      },
    });
  } catch (e) {
    const mapped = dbUnreachableResponse(e);
    if (mapped) return mapped;
    throw e;
  }
}
