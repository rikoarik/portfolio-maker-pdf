import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { draftToPrismaJson, parseDraft } from "@/lib/draft";
import { jsonError } from "@/lib/http";
import { deleteProjectFiles } from "@/lib/storage";
import { serializeProject } from "@/lib/project-serializer";
import { ensureProjectAccess } from "@/lib/project-access";
import { Prisma } from "@/generated/prisma/client";

type Ctx = { params: Promise<{ id: string }> };

function newSectionId(): string {
  return `sec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function isValidHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const project = await prisma.portfolioProject.findUnique({
    where: { id },
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
  const base = new URL(req.url).origin;
  return NextResponse.json(serializeProject(project, base));
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const existing = await prisma.portfolioProject.findUnique({ where: { id } });
  if (!existing) {
    return jsonError(404, "not_found", "Project not found");
  }
  const denied = await ensureProjectAccess(existing);
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonError(400, "invalid_json", "Request body must be JSON");
  }

  const title =
    typeof body.title === "string" ? body.title : existing.title;
  const locale =
    typeof body.locale === "string" ? body.locale : existing.locale;
  const jobFocus =
    typeof body.jobFocus === "string" ? body.jobFocus : existing.jobFocus;
  const industry =
    typeof body.industry === "string" ? body.industry : existing.industry;
  let draftPayload = existing.draftPayload as Prisma.InputJsonValue;

  if (body.draft !== undefined && body.draft !== null) {
    const merged = parseDraft(existing.draftPayload);
    const incoming = body.draft as Record<string, unknown>;
    if (typeof incoming.projectSummary === "string") {
      merged.projectSummary = incoming.projectSummary;
    }
    if (Array.isArray(incoming.techStack)) {
      merged.techStack = incoming.techStack.map((x) => String(x));
    }
    if (Array.isArray(incoming.screens)) {
      merged.screens = incoming.screens.map((s: Record<string, unknown>) => ({
        assetId: String(s.assetId ?? ""),
        title: String(s.title ?? ""),
        bullets: Array.isArray(s.bullets)
          ? s.bullets.map((b) => String(b))
          : [],
        notes: String(s.notes ?? ""),
      }));
    }
    if (typeof incoming.roleFocus === "string") {
      merged.roleFocus = incoming.roleFocus;
    }
    if (Array.isArray(incoming.highlights)) {
      merged.highlights = incoming.highlights.map((h) => String(h));
    }
    if (Array.isArray(incoming.sections)) {
      merged.sections = incoming.sections.map(
        (sec: Record<string, unknown>) => ({
          id:
            typeof sec.id === "string" && sec.id.trim()
              ? sec.id.trim()
              : newSectionId(),
          label: String(sec.label ?? ""),
          content: String(sec.content ?? ""),
          templateKey:
            typeof sec.templateKey === "string" ? sec.templateKey : undefined,
        }),
      );
    }
    if (typeof incoming.templateId === "string") {
      merged.templateId = incoming.templateId || undefined;
    }
    if (Array.isArray(incoming.prototypeLinks)) {
      const nextLinks = incoming.prototypeLinks.map((l: Record<string, unknown>) => ({
        label: String(l.label ?? ""),
        url: String(l.url ?? ""),
      }));
      for (const l of nextLinks) {
        if (l.url && !isValidHttpUrl(l.url)) {
          return jsonError(400, "invalid_url", "prototypeLinks.url must be a valid http(s) URL");
        }
      }
      merged.prototypeLinks = nextLinks;
    }
    if (typeof incoming.testResults === "string") {
      merged.testResults = incoming.testResults || undefined;
    }
    if (Array.isArray(incoming.studies)) {
      merged.studies = incoming.studies.map(
        (st: Record<string, unknown>) => ({
          id: String(st.id ?? ""),
          title: String(st.title ?? ""),
          summary: String(st.summary ?? ""),
          tags: Array.isArray(st.tags)
            ? st.tags.map((t) => String(t))
            : [],
          screenAssetIds: Array.isArray(st.screenAssetIds)
            ? st.screenAssetIds.map((x) => String(x))
            : [],
        }),
      );
    }
    draftPayload = draftToPrismaJson(merged) as Prisma.InputJsonValue;
  }

  const project = await prisma.portfolioProject.update({
    where: { id },
    data: { title, locale, jobFocus, industry, draftPayload },
    include: {
      screenshots: {
        orderBy: { sortOrder: "asc" },
        include: {
          analysisResults: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  const base = new URL(req.url).origin;
  return NextResponse.json(serializeProject(project, base));
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const existing = await prisma.portfolioProject.findUnique({ where: { id } });
  if (!existing) {
    return jsonError(404, "not_found", "Project not found");
  }
  const denied = await ensureProjectAccess(existing);
  if (denied) return denied;
  await prisma.portfolioProject.delete({ where: { id } });
  await deleteProjectFiles(id).catch(() => {});
  return new NextResponse(null, { status: 204 });
}
