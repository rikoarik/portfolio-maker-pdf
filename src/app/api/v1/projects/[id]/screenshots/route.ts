import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  ALLOWED_IMAGE_MIMES,
  MAX_SCREENSHOT_BYTES,
  MAX_SCREENSHOTS_PER_PROJECT,
} from "@/lib/constants";
import { jsonError } from "@/lib/http";
import { storageKeyForProject, writeUploadFile } from "@/lib/storage";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";
import { RATE_LIMIT_UPLOAD } from "@/lib/constants";
import { getRequestId } from "@/lib/api-context";
import { logApi } from "@/lib/logger";
import { assertCanAddScreenshots, QuotaExceededError } from "@/lib/quota";
import { ensureProjectAccess } from "@/lib/project-access";
import sharp from "sharp";

type Ctx = { params: Promise<{ id: string }> };

function extFromMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const requestId = await getRequestId();
  const rl = rateLimit(
    `upload:${clientKeyFromRequest(req)}`,
    RATE_LIMIT_UPLOAD.max,
    RATE_LIMIT_UPLOAD.windowMs,
  );
  if (!rl.ok) {
    logApi("warn", "rate_limited", { requestId, path: "POST screenshots" });
    return jsonError(
      429,
      "rate_limited",
      "Too many uploads. Try again later.",
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

  const form = await req.formData();
  const files = form.getAll("files") as File[];
  if (!files.length) {
    return jsonError(400, "no_files", 'Expected multipart field "files"');
  }

  if (project._count.screenshots + files.length > MAX_SCREENSHOTS_PER_PROJECT) {
    return jsonError(
      400,
      "too_many_files",
      `Maximum ${MAX_SCREENSHOTS_PER_PROJECT} screenshots per project`,
    );
  }

  if (project.userId) {
    try {
      await assertCanAddScreenshots(
        project.userId,
        project._count.screenshots,
        files.length,
        MAX_SCREENSHOTS_PER_PROJECT,
      );
    } catch (e) {
      if (e instanceof QuotaExceededError) {
        return jsonError(402, e.code, e.message);
      }
      throw e;
    }
  }

  const created: {
    id: string;
    sortOrder: number;
    mime: string;
    previewUrl: string;
  }[] = [];

  let sortBase = project._count.screenshots;

  for (const file of files) {
    if (!(file instanceof File)) continue;
    const mime = file.type || "application/octet-stream";
    if (!ALLOWED_IMAGE_MIMES.has(mime)) {
      return jsonError(
        400,
        "invalid_mime",
        `Unsupported type: ${mime}. Use PNG, JPEG, or WebP.`,
      );
    }
    if (file.size > MAX_SCREENSHOT_BYTES) {
      return jsonError(
        400,
        "file_too_large",
        `Max ${MAX_SCREENSHOT_BYTES} bytes per file`,
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    let width: number | undefined;
    let height: number | undefined;
    try {
      const meta = await sharp(buf).metadata();
      width = meta.width;
      height = meta.height;
    } catch {
      // ignore
    }

    const ext = extFromMime(mime);
    const storageKey = storageKeyForProject(projectId, ext);
    await writeUploadFile(storageKey, buf);

    const asset = await prisma.screenshotAsset.create({
      data: {
        projectId,
        sortOrder: sortBase,
        storageKey,
        mime,
        width: width ?? null,
        height: height ?? null,
        analysisStatus: "pending",
      },
    });
    sortBase += 1;

    const origin = new URL(req.url).origin;
    created.push({
      id: asset.id,
      sortOrder: asset.sortOrder,
      mime: asset.mime,
      previewUrl: `${origin}/api/v1/projects/${projectId}/screenshots/${asset.id}/file`,
    });
  }

  return NextResponse.json({ screenshots: created }, { status: 201 });
}
