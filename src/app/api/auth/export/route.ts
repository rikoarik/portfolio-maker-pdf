import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { getSessionUserIdSynced } from "@/lib/project-access";

export async function GET() {
  const userId = await getSessionUserIdSynced();
  if (!userId) {
    return jsonError(401, "unauthorized", "Login required");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      plan: {
        select: {
          slug: true,
          name: true,
        },
      },
      projects: {
        include: {
          screenshots: {
            include: {
              analysisResults: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
          jobs: true,
        },
        orderBy: { updatedAt: "desc" },
      },
      usageCounters: {
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!user) {
    return jsonError(404, "not_found", "User not found");
  }

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    user,
  });
}
