import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { readUploadFile } from "@/lib/storage";
import { ensureProjectAccess } from "@/lib/project-access";

type Ctx = { params: Promise<{ id: string; assetId: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id: projectId, assetId } = await ctx.params;

  const project = await prisma.portfolioProject.findUnique({
    where: { id: projectId },
  });
  if (!project) {
    return jsonError(404, "not_found", "Project not found");
  }
  const denied = await ensureProjectAccess(project);
  if (denied) return denied;

  const asset = await prisma.screenshotAsset.findFirst({
    where: { id: assetId, projectId },
  });
  if (!asset) {
    return jsonError(404, "not_found", "Screenshot not found");
  }

  const buffer = await readUploadFile(asset.storageKey);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": asset.mime,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
