import { prisma } from "@/lib/db";
import { parseDraft, draftToPrismaJson, type DraftPayload } from "@/lib/draft";
import {
  aggregateProjectNarrative,
  analyzeScreenshot,
} from "@/lib/gemini";
import { resolveGeminiApiKeyForUser } from "@/lib/ai-api-key";
import { log } from "@/lib/logger";
import { incrementUsage } from "@/lib/quota";
import { readUploadFile } from "@/lib/storage";

const MODEL = () => process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

function modelFromJobPayload(payload: unknown): string | undefined {
  if (payload && typeof payload === "object" && "modelPreference" in payload) {
    const v = (payload as { modelPreference?: string }).modelPreference;
    return typeof v === "string" ? v : undefined;
  }
  return undefined;
}

export async function runAnalyzeJob(jobId: string): Promise<void> {
  const startedAt = Date.now();
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || job.type !== "analyze") return;
  log("info", "analyze_job_started", { jobId, projectId: job.projectId });

  const requestedModel = modelFromJobPayload(job.payload);

  await prisma.job.update({
    where: { id: jobId },
    data: { status: "running", progress: 0, error: null },
  });

  const project = await prisma.portfolioProject.findUnique({
    where: { id: job.projectId },
    include: { screenshots: { orderBy: { sortOrder: "asc" } } },
  });

  if (!project) {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "failed", error: "Project not found" },
    });
    return;
  }

  const total = project.screenshots.length;
  if (total === 0) {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "failed", error: "No screenshots to analyze" },
    });
    return;
  }

  let draft: DraftPayload = parseDraft(project.draftPayload);
  const aiApiKey = await resolveGeminiApiKeyForUser(project.userId);
  if (!aiApiKey) {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "failed", error: "GEMINI_API_KEY is not configured" },
    });
    return;
  }
  let done = 0;
  let failCount = 0;

  for (const asset of project.screenshots) {
    try {
      const buf = await readUploadFile(asset.storageKey);
      const vision = await analyzeScreenshot(
        buf,
        asset.mime,
        project.locale,
        undefined,
        requestedModel,
        {
          roleFocus: project.jobFocus || undefined,
          industry: project.industry || undefined,
          templateId: draft.templateId,
          portfolioPersona: draft.portfolioPersona,
        },
        aiApiKey,
      );

      await prisma.analysisResult.create({
        data: {
          assetId: asset.id,
          model: MODEL(),
          rawJson: vision as object,
          summaryText: vision.ux_notes,
        },
      });

      const screenDraft = {
        assetId: asset.id,
        title: vision.screen_title,
        bullets: vision.features.slice(0, 5),
        notes: vision.ux_notes,
      };
      const idx = draft.screens.findIndex((s) => s.assetId === asset.id);
      if (idx >= 0) draft.screens[idx] = screenDraft;
      else draft.screens.push(screenDraft);

      draft.techStack = [
        ...new Set([...draft.techStack, ...vision.tech_guess]),
      ].slice(0, 24);

      await prisma.screenshotAsset.update({
        where: { id: asset.id },
        data: { analysisStatus: "ok" },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Analysis failed";
      failCount += 1;
      await prisma.analysisResult.create({
        data: {
          assetId: asset.id,
          model: MODEL(),
          rawJson: {},
          summaryText: "",
          errorCode: msg.slice(0, 500),
        },
      });
      await prisma.screenshotAsset.update({
        where: { id: asset.id },
        data: { analysisStatus: "failed" },
      });
      log("warn", "analyze_asset_failed", {
        jobId,
        projectId: project.id,
        assetId: asset.id,
        error: msg.slice(0, 200),
      });
      log("warn", "analyze_failed", {
        jobId,
        projectId: project.id,
        assetId: asset.id,
      });
    }

    done += 1;
    const progress = Math.min(95, Math.round((done / total) * 90));
    await prisma.job.update({
      where: { id: jobId },
      data: { progress },
    });
    await prisma.portfolioProject.update({
      where: { id: project.id },
      data: { draftPayload: draftToPrismaJson(draft) },
    });
  }

  try {
    draft = parseDraft(
      (
        await prisma.portfolioProject.findUnique({
          where: { id: project.id },
        })
      )!.draftPayload,
    );
    const agg = await aggregateProjectNarrative(
      draft,
      project.locale,
      requestedModel,
      {
        roleFocus: project.jobFocus || undefined,
        industry: project.industry || undefined,
        templateId: draft.templateId,
        portfolioPersona: draft.portfolioPersona,
      },
      aiApiKey,
    );
    draft.projectSummary = agg.projectSummary;
    draft.techStack = [...new Set([...draft.techStack, ...agg.techStack])].slice(
      0,
      16,
    );
    await prisma.portfolioProject.update({
      where: { id: project.id },
      data: { draftPayload: draftToPrismaJson(draft) },
    });
  } catch {
    // optional narrative
  }

  await prisma.job.update({
    where: { id: jobId },
    data: { status: "completed", progress: 100, error: null },
  });
  log("info", "analyze_job_completed", {
    jobId,
    projectId: project.id,
    screenshotTotal: total,
    failedScreenshots: failCount,
    durationMs: Date.now() - startedAt,
  });
  log("info", "analyze_completed", {
    jobId,
    projectId: project.id,
    screenshotTotal: total,
    failedScreenshots: failCount,
  });

  if (project.userId) {
    await incrementUsage(project.userId, "ai_analysis", 1);
  }
}

/** Re-analyze one screenshot (e.g. retry after failure). */
export async function runSingleAssetAnalyze(
  assetId: string,
  extraInstruction?: string,
): Promise<void> {
  const startedAt = Date.now();
  const asset = await prisma.screenshotAsset.findUnique({
    where: { id: assetId },
    include: { project: true },
  });
  if (!asset) throw new Error("Screenshot not found");

  const project = asset.project;
  const aiApiKey = await resolveGeminiApiKeyForUser(project.userId);
  if (!aiApiKey) throw new Error("GEMINI_API_KEY is not configured");
  const draft = parseDraft(project.draftPayload);
  const buf = await readUploadFile(asset.storageKey);
  const vision = await analyzeScreenshot(
    buf,
    asset.mime,
    project.locale,
    extraInstruction,
    undefined,
    {
      roleFocus: project.jobFocus || undefined,
      industry: project.industry || undefined,
      templateId: draft.templateId,
      portfolioPersona: draft.portfolioPersona,
    },
    aiApiKey,
  );

  await prisma.analysisResult.create({
    data: {
      assetId: asset.id,
      model: MODEL(),
      rawJson: vision as object,
      summaryText: vision.ux_notes,
    },
  });

  const screenDraft = {
    assetId: asset.id,
    title: vision.screen_title,
    bullets: vision.features.slice(0, 5),
    notes: vision.ux_notes,
  };
  const idx = draft.screens.findIndex((s) => s.assetId === asset.id);
  if (idx >= 0) draft.screens[idx] = screenDraft;
  else draft.screens.push(screenDraft);
  draft.techStack = [
    ...new Set([...draft.techStack, ...vision.tech_guess]),
  ].slice(0, 24);

  await prisma.screenshotAsset.update({
    where: { id: asset.id },
    data: { analysisStatus: "ok" },
  });
  await prisma.portfolioProject.update({
    where: { id: project.id },
    data: { draftPayload: draftToPrismaJson(draft) },
  });

  if (project.userId) {
    await incrementUsage(project.userId, "ai_analysis", 1);
  }
  log("info", "single_asset_analyzed", {
    projectId: project.id,
    assetId,
    durationMs: Date.now() - startedAt,
  });
}
