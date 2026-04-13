import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { getRequestId } from "@/lib/api-context";
import { logApi } from "@/lib/logger";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";
import { RATE_LIMIT_ANALYZE } from "@/lib/constants";
import { enqueueAnalyzeJob } from "@/lib/job-queue";
import { ensureProjectAccess, getSessionUserId } from "@/lib/project-access";
import {
  assertCanRunAiAnalysis,
  getUserWithPlan,
  QuotaExceededError,
} from "@/lib/quota";
import { resolveGeminiApiKeyForUser } from "@/lib/ai-api-key";

type Ctx = { params: Promise<{ id: string }> };

function isProUser(user: {
  tier: string;
  plan: { slug: string } | null;
}): boolean {
  return user.tier === "PRO" || user.plan?.slug === "pro";
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const requestId = await getRequestId();
  logApi("info", "analyze_started", { requestId, path: "POST /analyze" });
  const rl = await rateLimit(
    `analyze:${clientKeyFromRequest(req)}`,
    RATE_LIMIT_ANALYZE.max,
    RATE_LIMIT_ANALYZE.windowMs,
  );
  if (!rl.ok) {
    logApi("warn", "rate_limited", {
      requestId,
      path: "POST /analyze",
      extra: { retryAfterMs: rl.retryAfterMs },
    });
    return jsonError(
      429,
      "rate_limited",
      "Too many analysis requests. Try again later.",
      { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
    );
  }

  const { id: projectId } = await ctx.params;

  const project = await prisma.portfolioProject.findUnique({
    where: { id: projectId },
    include: { _count: { select: { screenshots: true } } },
  });
  if (!project) {
    return jsonError(404, "not_found", "Project not found");
  }
  const denied = await ensureProjectAccess(project);
  if (denied) return denied;
  if (project._count.screenshots === 0) {
    return jsonError(400, "no_screenshots", "Upload screenshots first");
  }

  let requestedModel = "flash";
  try {
    const body = await req.json();
    if (body && typeof body.model === "string") {
      requestedModel = body.model;
    }
  } catch {
    /* no body */
  }

  const uid = await getSessionUserId();
  if (uid) {
    const user = await getUserWithPlan(uid);
    if (!user) {
      return jsonError(401, "unauthorized", "User not found");
    }

    if (requestedModel === "pro" && !isProUser(user)) {
      return jsonError(
        403,
        "forbidden",
        "Model Gemini Pro hanya tersedia untuk paket Pro.",
      );
    }

    const maxShots = user.plan?.maxScreenshotsPerProject ?? 20;
    if (project._count.screenshots > maxShots) {
      return jsonError(
        403,
        "limit_exceeded",
        `Paket Anda mengizinkan maksimal ${maxShots} screenshot per proyek.`,
      );
    }

    try {
      await assertCanRunAiAnalysis(uid);
    } catch (e) {
      if (e instanceof QuotaExceededError) {
        return jsonError(402, e.code, e.message);
      }
      throw e;
    }
  } else {
    if (requestedModel === "pro") {
      return jsonError(
        403,
        "forbidden",
        "Model Gemini Pro mengharuskan login dan paket Pro.",
      );
    }
  }

  const aiApiKey = await resolveGeminiApiKeyForUser(project.userId);
  if (!aiApiKey) {
    return jsonError(
      503,
      "gemini_unconfigured",
      "GEMINI_API_KEY is not configured for this user/server",
    );
  }

  const job = await prisma.job.create({
    data: {
      type: "analyze",
      projectId,
      status: "queued",
      progress: 0,
      payload: { modelPreference: requestedModel },
    },
  });

  logApi("info", "analyze_queued", {
    requestId,
    projectId,
    jobId: job.id,
    path: "POST /analyze",
  });

  try {
    await enqueueAnalyzeJob(job.id);
    logApi("info", "analyze_enqueued", {
      requestId,
      projectId,
      jobId: job.id,
      path: "POST /analyze",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Queue unavailable";
    await prisma.job.update({
      where: { id: job.id },
      data: { status: "failed", error: msg.slice(0, 500) },
    });
    logApi("error", "analyze_enqueue_failed", {
      requestId,
      projectId,
      jobId: job.id,
      path: "POST /analyze",
      extra: { error: msg.slice(0, 200) },
    });
    return jsonError(
      503,
      "analyze_queue_unavailable",
      "Antrean analisis sedang bermasalah. Coba lagi beberapa saat.",
    );
  }

  return NextResponse.json({ jobId: job.id });
}
