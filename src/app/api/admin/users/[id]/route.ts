import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  let body: { tier?: unknown; planId?: unknown; aiApiKey?: unknown };
  try {
    body = (await req.json()) as {
      tier?: unknown;
      planId?: unknown;
      aiApiKey?: unknown;
    };
  } catch {
    return jsonError(400, "invalid_json", "Body harus JSON.");
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return jsonError(404, "not_found", "User tidak ditemukan.");

  const data: { tier?: string; planId?: string | null; aiApiKey?: string | null } =
    {};

  if (typeof body.tier === "string") {
    const t = body.tier.toUpperCase();
    if (t !== "FREE" && t !== "PRO") {
      return jsonError(400, "invalid_tier", "tier harus FREE atau PRO.");
    }
    data.tier = t;
  }

  if (body.planId === null) {
    data.planId = null;
  } else if (typeof body.planId === "string") {
    const plan = await prisma.plan.findUnique({ where: { id: body.planId } });
    if (!plan) return jsonError(400, "invalid_plan", "planId tidak dikenal.");
    data.planId = plan.id;
  }

  if (body.aiApiKey === null) {
    data.aiApiKey = null;
  } else if (typeof body.aiApiKey === "string") {
    const v = body.aiApiKey.trim();
    data.aiApiKey = v.length ? v : null;
  }

  if (
    data.tier === undefined &&
    data.planId === undefined &&
    data.aiApiKey === undefined
  ) {
    return jsonError(400, "no_updates", "Kirim tier, planId, dan/atau aiApiKey.");
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      tier: true,
      planId: true,
      aiApiKey: true,
      plan: { select: { slug: true, name: true } },
    },
  });

  await writeAuditLog({
    actorUserId: auth.userId,
    action: "admin_user_override",
    targetUserId: id,
    metadata: {
      before: {
        tier: existing.tier,
        planId: existing.planId,
        aiApiKey: existing.aiApiKey ? "***" : null,
      },
      after: data,
    },
  });

  return NextResponse.json({ user: updated });
}
