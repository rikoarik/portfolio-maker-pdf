import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { draftToPrismaJson, emptyDraft } from "@/lib/draft";
import { jsonError } from "@/lib/http";
import { dbUnreachableResponse } from "@/lib/prisma-errors";
import {
  assertCanCreateProject,
  QuotaExceededError,
} from "@/lib/quota";
import { getSessionUserId, getSessionUserIdSynced } from "@/lib/project-access";

export async function GET() {
  const uid = await getSessionUserId();
  if (!uid) {
    return jsonError(401, "unauthorized", "Login required to list projects");
  }
  try {
    const projects = await prisma.portfolioProject.findMany({
      where: { userId: uid },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        _count: { select: { screenshots: true } },
      },
    });
    return NextResponse.json({
      projects: projects.map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        updatedAt: p.updatedAt.toISOString(),
        screenshotCount: p._count.screenshots,
      })),
    });
  } catch (e) {
    const mapped = dbUnreachableResponse(e);
    if (mapped) return mapped;
    throw e;
  }
}

export async function POST(req: NextRequest) {
  let title = "";
  let locale = "id";
  try {
    const body = (await req.json()) as { title?: unknown; locale?: unknown };
    if (typeof body.title === "string") title = body.title;
    if (typeof body.locale === "string") locale = body.locale;
  } catch {
    // empty body ok
  }

  try {
    const userId = await getSessionUserIdSynced();

    if (userId) {
      try {
        await assertCanCreateProject(userId);
      } catch (e) {
        if (e instanceof QuotaExceededError) {
          return jsonError(402, e.code, e.message);
        }
        throw e;
      }
    }

    const project = await prisma.portfolioProject.create({
      data: {
        title,
        locale,
        draftPayload: draftToPrismaJson(emptyDraft()),
        userId: userId ?? undefined,
      },
    });

    return NextResponse.json(
      {
        id: project.id,
        title: project.title,
        locale: project.locale,
        status: project.status,
        createdAt: project.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (e) {
    const mapped = dbUnreachableResponse(e);
    if (mapped) return mapped;
    throw e;
  }
}
