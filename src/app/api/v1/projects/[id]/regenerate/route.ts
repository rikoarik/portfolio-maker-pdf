import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseDraft, draftToPrismaJson } from "@/lib/draft";
import { jsonError } from "@/lib/http";
import {
  assertCanRunAiAnalysis,
  incrementUsage,
  QuotaExceededError,
} from "@/lib/quota";
import { ensureProjectAccess } from "@/lib/project-access";
import { regenerateDraftWithInstruction } from "@/lib/gemini";
import { serializeProject } from "@/lib/project-serializer";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const { id: projectId } = await ctx.params;

  if (!process.env.GEMINI_API_KEY) {
    return jsonError(
      503,
      "gemini_unconfigured",
      "GEMINI_API_KEY is not configured on the server",
    );
  }

  let instruction = "";
  try {
    const j = (await req.json()) as { instruction?: string };
    instruction = String(j.instruction ?? "").trim();
  } catch {
    return jsonError(400, "invalid_json", "Expected JSON body with instruction");
  }
  if (!instruction) {
    return jsonError(400, "missing_instruction", "instruction is required");
  }

  const project = await prisma.portfolioProject.findUnique({
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
  if (!project) {
    return jsonError(404, "not_found", "Project not found");
  }
  const denied = await ensureProjectAccess(project);
  if (denied) return denied;

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

  const draft = parseDraft(project.draftPayload);
  let nextDraft;
  try {
    nextDraft = await regenerateDraftWithInstruction(
      draft,
      project.locale,
      instruction,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Regenerate failed";
    return jsonError(500, "regenerate_failed", msg);
  }

  const saved = await prisma.portfolioProject.update({
    where: { id: projectId },
    data: { draftPayload: draftToPrismaJson(nextDraft) },
    include: {
      screenshots: {
        orderBy: { sortOrder: "asc" },
        include: {
          analysisResults: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  if (project.userId) {
    await incrementUsage(project.userId, "ai_analysis", 1);
  }

  const base = new URL(req.url).origin;
  return NextResponse.json(serializeProject(saved, base));
}
