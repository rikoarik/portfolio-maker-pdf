import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import type { Prisma } from "@/generated/prisma/client";

type PatchBody = {
  name?: unknown;
  stripePriceId?: unknown;
  midtransPackageCode?: unknown;
  maxProjects?: unknown;
  maxScreenshotsPerProject?: unknown;
  maxAiAnalysesPerPeriod?: unknown;
  maxPdfExportsPerPeriod?: unknown;
  periodDays?: unknown;
  sortOrder?: unknown;
  active?: unknown;
};

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return jsonError(400, "invalid_json", "Body harus JSON.");
  }

  const existing = await prisma.plan.findUnique({ where: { id } });
  if (!existing) return jsonError(404, "not_found", "Plan tidak ditemukan.");

  const data: Record<string, unknown> = {};

  if (typeof body.name === "string") data.name = body.name.trim() || existing.name;
  if (body.stripePriceId === null) data.stripePriceId = null;
  else if (typeof body.stripePriceId === "string")
    data.stripePriceId = body.stripePriceId.trim() || null;
  if (body.midtransPackageCode === null) data.midtransPackageCode = null;
  else if (typeof body.midtransPackageCode === "string")
    data.midtransPackageCode = body.midtransPackageCode.trim() || null;

  const intFields: (keyof PatchBody)[] = [
    "maxProjects",
    "maxScreenshotsPerProject",
    "maxAiAnalysesPerPeriod",
    "maxPdfExportsPerPeriod",
    "periodDays",
    "sortOrder",
  ];
  for (const k of intFields) {
    const v = body[k];
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
      data[k] = Math.floor(v);
    }
  }
  if (typeof body.active === "boolean") data.active = body.active;

  if (Object.keys(data).length === 0) {
    return jsonError(400, "no_updates", "Tidak ada field yang valid untuk diubah.");
  }

  const updated = await prisma.plan.update({
    where: { id },
    data: data as Prisma.PlanUpdateInput,
  });

  await writeAuditLog({
    actorUserId: auth.userId,
    action: "admin_plan_update",
    metadata: {
      planId: id,
      before: {
        name: existing.name,
        stripePriceId: existing.stripePriceId,
        midtransPackageCode: existing.midtransPackageCode,
        maxProjects: existing.maxProjects,
        maxScreenshotsPerProject: existing.maxScreenshotsPerProject,
        maxAiAnalysesPerPeriod: existing.maxAiAnalysesPerPeriod,
        maxPdfExportsPerPeriod: existing.maxPdfExportsPerPeriod,
      },
      after: data,
    },
  });

  return NextResponse.json({ plan: updated });
}
