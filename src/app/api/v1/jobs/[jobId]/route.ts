import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";

type Ctx = { params: Promise<{ jobId: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { jobId } = await ctx.params;
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      type: true,
      status: true,
      progress: true,
      error: true,
      projectId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!job) {
    return jsonError(404, "not_found", "Job not found");
  }
  return NextResponse.json({
    id: job.id,
    type: job.type,
    status: job.status,
    progress: job.progress,
    error: job.error,
    projectId: job.projectId,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  });
}
