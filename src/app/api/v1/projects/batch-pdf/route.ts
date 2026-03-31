import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseDraft } from "@/lib/draft";
import { jsonError } from "@/lib/http";
import { bufferToPdfImageDataUri } from "@/lib/pdf/image-for-pdf";
import { readUploadFile } from "@/lib/storage";
import { renderMultiProjectPdfBuffer } from "@/lib/pdf/render";
import { ensureProjectAccess, getSessionUserIdSynced } from "@/lib/project-access";
import {
  assertCanExportPdf,
  incrementUsage,
  QuotaExceededError,
} from "@/lib/quota";

const MAX_BATCH = 10;

export async function POST(req: NextRequest) {
  let projectIds: string[] = [];
  let templateId = "default";

  try {
    const j = (await req.json()) as {
      projectIds?: unknown;
      templateId?: unknown;
    };
    if (!Array.isArray(j?.projectIds) || j.projectIds.length === 0) {
      return jsonError(400, "bad_request", "projectIds harus berupa array non-kosong.");
    }
    projectIds = j.projectIds.map(String).slice(0, MAX_BATCH);
    if (j?.templateId === "compact") templateId = "compact";
  } catch {
    return jsonError(400, "bad_request", "Body JSON tidak valid.");
  }

  const sessionUserId = await getSessionUserIdSynced();
  if (sessionUserId) {
    try {
      await assertCanExportPdf(sessionUserId);
    } catch (e) {
      if (e instanceof QuotaExceededError) {
        return jsonError(402, e.code, e.message);
      }
      throw e;
    }
  }

  // Ambil semua project dari DB
  const projects = await prisma.portfolioProject.findMany({
    where: { id: { in: projectIds } },
    include: { screenshots: { orderBy: { sortOrder: "asc" } } },
  });

  if (projects.length === 0) {
    return jsonError(404, "not_found", "Tidak ada project yang ditemukan.");
  }

  // Validasi akses satu per satu
  for (const project of projects) {
    const denied = await ensureProjectAccess(project);
    if (denied) return denied;
  }

  // Preserve the requested order (projectIds order)
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const orderedProjects = projectIds
    .map((id) => projectMap.get(id))
    .filter(Boolean) as typeof projects;

  // Build PortfolioPdfProps per project
  const pdfProjects = await Promise.all(
    orderedProjects.map(async (project) => {
      const draft = parseDraft(project.draftPayload);
      const images = await Promise.all(
        project.screenshots.map(async (s) => {
          const buf = await readUploadFile(s.storageKey);
          const dataUri = await bufferToPdfImageDataUri(buf);
          return { assetId: s.id, dataUri };
        }),
      );
      return {
        title: project.title,
        draft,
        images,
      };
    }),
  );

  const buffer = await renderMultiProjectPdfBuffer({ projects: pdfProjects }, templateId);

  if (sessionUserId) {
    await incrementUsage(sessionUserId, "pdf_export", 1);
  }

  const filename = `portfolio-gabungan-${Date.now()}`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}.pdf"`,
    },
  });
}
