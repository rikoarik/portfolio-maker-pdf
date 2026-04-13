import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import {
  assertCanRunAiAnalysis,
  QuotaExceededError,
} from "@/lib/quota";
import { ensureProjectAccess } from "@/lib/project-access";
import { runSingleAssetAnalyze } from "@/lib/analyze-job";
import { resolveGeminiApiKeyForUser } from "@/lib/ai-api-key";

type Ctx = { params: Promise<{ id: string; assetId: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const { id: projectId, assetId } = await ctx.params;

  const project = await prisma.portfolioProject.findUnique({
    where: { id: projectId },
  });
  if (!project) {
    return jsonError(404, "not_found", "Project not found");
  }
  const denied = await ensureProjectAccess(project);
  if (denied) return denied;
  const aiApiKey = await resolveGeminiApiKeyForUser(project.userId);
  if (!aiApiKey) {
    return jsonError(
      503,
      "gemini_unconfigured",
      "GEMINI_API_KEY is not configured for this user/server",
    );
  }

  if (project.userId) {
    try {
      await assertCanRunAiAnalysis(project.userId);
    } catch (e) {
      if (e instanceof QuotaExceededError) {
        return jsonError(402, e.code, e.message);
      }
      throw e;
    }
  }

  const asset = await prisma.screenshotAsset.findFirst({
    where: { id: assetId, projectId },
  });
  if (!asset) {
    return jsonError(404, "not_found", "Screenshot not found");
  }

  let extraInstruction: string | undefined;
  try {
    const j = (await req.json()) as { instruction?: string };
    if (typeof j.instruction === "string") extraInstruction = j.instruction;
  } catch {
    // optional body
  }

  try {
    await runSingleAssetAnalyze(assetId, extraInstruction);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Retry failed";
    await prisma.screenshotAsset.update({
      where: { id: assetId },
      data: { analysisStatus: "failed" },
    });
    return jsonError(500, "retry_failed", msg);
  }

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
    return jsonError(404, "not_found", "Project not found");
  }
  const base = new URL(req.url).origin;
  const { serializeProject } = await import("@/lib/project-serializer");
  return NextResponse.json(serializeProject(updated, base));
}
