import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseDraft } from "@/lib/draft";
import { jsonError } from "@/lib/http";
import { bufferToPdfImageDataUri } from "@/lib/pdf/image-for-pdf";
import { readUploadFile } from "@/lib/storage";
import { renderPortfolioPdfBuffer } from "@/lib/pdf/render";
import {
  assertCanExportPdf,
  incrementUsage,
  QuotaExceededError,
} from "@/lib/quota";
import { ensureProjectAccess } from "@/lib/project-access";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const { id: projectId } = await ctx.params;

  const project = await prisma.portfolioProject.findUnique({
    where: { id: projectId },
    include: { screenshots: { orderBy: { sortOrder: "asc" } } },
  });
  if (!project) {
    return jsonError(404, "not_found", "Project not found");
  }
  const denied = await ensureProjectAccess(project);
  if (denied) return denied;

  if (project.userId) {
    try {
      await assertCanExportPdf(project.userId);
    } catch (e) {
      if (e instanceof QuotaExceededError) {
        return jsonError(402, e.code, e.message);
      }
      throw e;
    }
  }

  let templateId = "default";
  try {
    const j = (await req.json()) as { templateId?: string };
    if (j?.templateId === "compact") templateId = "compact";
  } catch {
    // body optional
  }

  const draft = parseDraft(project.draftPayload);
  const images = await Promise.all(
    project.screenshots.map(async (s) => {
      const buf = await readUploadFile(s.storageKey);
      const dataUri = await bufferToPdfImageDataUri(buf);
      return {
        assetId: s.id,
        dataUri,
      };
    }),
  );

  const buffer = await renderPortfolioPdfBuffer(
    {
      title: project.title,
      draft,
      images,
    },
    templateId,
  );

  if (project.userId) {
    await incrementUsage(project.userId, "pdf_export", 1);
  }

  const filename = `portfolio-${project.id}`.replace(/[^a-zA-Z0-9-_]/g, "_");

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}.pdf"`,
    },
  });
}
