import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseDraft, draftToPrismaJson } from "@/lib/draft";
import { jsonError } from "@/lib/http";
import { ensureProjectAccess } from "@/lib/project-access";
import { generateNarrativeBlocks } from "@/lib/gemini";
import { getRequestId } from "@/lib/api-context";
import { logApi } from "@/lib/logger";
import { resolveGeminiApiKeyForUser } from "@/lib/ai-api-key";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const requestId = await getRequestId();
  const { id: projectId } = await ctx.params;
  const project = await prisma.portfolioProject.findUnique({
    where: { id: projectId },
  });
  if (!project) return jsonError(404, "not_found", "Project not found");
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

  let body: {
    mode?: unknown;
    manualInput?: { problem?: unknown; solution?: unknown; impact?: unknown };
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return jsonError(400, "invalid_json", "Request body must be JSON");
  }
  const mode = body?.mode === "rewrite" ? "rewrite" : "auto";
  logApi("info", "content_mode_selected", {
    requestId,
    projectId,
    path: "POST /narrative",
    extra: { mode },
  });
  const manualInput = body?.manualInput;
  if (mode === "rewrite") {
    const hasManual =
      typeof manualInput?.problem === "string" ||
      typeof manualInput?.solution === "string" ||
      typeof manualInput?.impact === "string";
    if (!hasManual) {
      return jsonError(
        400,
        "invalid_manual_input",
        "manualInput wajib diisi untuk mode rewrite.",
      );
    }
  }

  const draft = parseDraft(project.draftPayload);
  const eventPrefix = mode === "rewrite" ? "narrative_rewrite" : "narrative_auto";
  logApi("info", `${eventPrefix}_started`, {
    requestId,
    projectId,
    path: "POST /narrative",
  });
  let output;
  try {
    output = await generateNarrativeBlocks({
      mode,
      locale: project.locale,
      draft,
      title: project.title,
      roleFocus: project.jobFocus,
      industry: project.industry,
      manualInput: manualInput
        ? {
            problem:
              typeof manualInput.problem === "string" ? manualInput.problem : undefined,
            solution:
              typeof manualInput.solution === "string" ? manualInput.solution : undefined,
            impact:
              typeof manualInput.impact === "string" ? manualInput.impact : undefined,
          }
        : undefined,
      apiKey: aiApiKey,
    });
  } catch (e) {
    logApi("error", `${eventPrefix}_failed`, {
      requestId,
      projectId,
      path: "POST /narrative",
      extra: { error: e instanceof Error ? e.message.slice(0, 200) : "unknown" },
    });
    throw e;
  }

  const nextDraft = {
    ...draft,
    problemSummary: output.problemSummary || undefined,
    solutionSummary: output.solutionSummary || undefined,
    impactSummary: output.impactSummary || undefined,
    contentMode: mode,
    impactConfidence: "hypothesis" as const,
    projectSummary: [output.problemSummary, output.solutionSummary, output.impactSummary]
      .filter(Boolean)
      .join(" "),
  };

  await prisma.portfolioProject.update({
    where: { id: projectId },
    data: { draftPayload: draftToPrismaJson(nextDraft) },
  });
  logApi("info", `${eventPrefix}_succeeded`, {
    requestId,
    projectId,
    path: "POST /narrative",
  });

  return NextResponse.json({
    narrative: output,
    draft: nextDraft,
  });
}
