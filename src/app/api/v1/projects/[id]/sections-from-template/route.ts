import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseDraft, draftToPrismaJson, type DraftSection } from "@/lib/draft";
import { jsonError } from "@/lib/http";
import {
  assertCanRunAiAnalysis,
  incrementUsage,
  QuotaExceededError,
} from "@/lib/quota";
import { ensureProjectAccess } from "@/lib/project-access";
import { serializeProject } from "@/lib/project-serializer";
import { generateTemplateSections } from "@/lib/template-sections";
import { generateSectionsWithAi } from "@/lib/gemini-sections";

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

  let body: { templateId?: string } = {};
  try {
    body = (await req.json()) as { templateId?: string };
  } catch {
    // allow empty body
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
  const templateId = String(body.templateId ?? draft.templateId ?? "").trim();
  if (!templateId) {
    return jsonError(400, "missing_template", "templateId is required");
  }

  const template = generateTemplateSections(templateId);
  if (!template) {
    return jsonError(400, "invalid_template", "Unknown templateId");
  }

  if (!project.jobFocus?.trim()) {
    return jsonError(400, "missing_job_focus", "jobFocus is required");
  }

  let sections: DraftSection[];
  let testResults: string | undefined;
  let prototypeLinks = draft.prototypeLinks;
  try {
    const out = await generateSectionsWithAi({
      locale: project.locale,
      jobFocus: project.jobFocus,
      industry: project.industry,
      title: project.title,
      projectSummary: draft.projectSummary,
      template,
      existing: draft.sections ?? [],
    });
    sections = out.sections;
    testResults = out.testResults;
    prototypeLinks = out.prototypeLinks ?? prototypeLinks;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Generate sections failed";
    return jsonError(500, "generate_sections_failed", msg);
  }

  const nextDraft = {
    ...draft,
    templateId,
    sections,
    prototypeLinks,
    testResults,
  };

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

