import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { draftToPrismaJson, parseDraft } from "@/lib/draft";
import { jsonError } from "@/lib/http";
import { deleteUploadFile } from "@/lib/storage";
import { serializeProject } from "@/lib/project-serializer";
import { ensureProjectAccess } from "@/lib/project-access";

type Ctx = { params: Promise<{ id: string; assetId: string }> };

export async function DELETE(_req: NextRequest, ctx: Ctx) {
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

  const draft = parseDraft(project.draftPayload);
  const nextScreens = draft.screens.filter((s) => s.assetId !== assetId);
  const nextStudies = draft.studies?.map((cs) => ({
    ...cs,
    screenAssetIds: cs.screenAssetIds.filter((id) => id !== assetId),
  }));

  const nextDraft = {
    ...draft,
    screens: nextScreens,
    studies: nextStudies,
  };

  await prisma.$transaction([
    prisma.portfolioProject.update({
      where: { id: projectId },
      data: { draftPayload: draftToPrismaJson(nextDraft) },
    }),
    prisma.screenshotAsset.delete({ where: { id: assetId } }),
  ]);

  await deleteUploadFile(asset.storageKey).catch(() => {});

  const updated = await prisma.portfolioProject.findUnique({
    where: { id: projectId },
    include: {
      screenshots: {
        orderBy: { sortOrder: "asc" },
        include: {
          analysisResults: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });
  if (!updated) {
    return jsonError(500, "internal", "Failed to reload project");
  }

  const base = new URL(_req.url).origin;
  return NextResponse.json(serializeProject(updated, base));
}
