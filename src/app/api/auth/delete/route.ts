import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { getSessionUserIdSynced } from "@/lib/project-access";
import { deleteProjectFiles } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const userId = await getSessionUserIdSynced();
  if (!userId) {
    return jsonError(401, "unauthorized", "Login required");
  }

  const projects = await prisma.portfolioProject.findMany({
    where: { userId },
    select: { id: true },
  });
  const projectIds = projects.map((p) => p.id);

  if (projectIds.length > 0) {
    await prisma.portfolioProject.deleteMany({
      where: { id: { in: projectIds } },
    });
    await Promise.all(projectIds.map((id) => deleteProjectFiles(id).catch(() => {})));
  }

  await prisma.usageCounter.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });

  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.json({
    ok: true,
    message:
      "Data aplikasi Anda sudah dihapus. Jika ingin menutup akun Supabase sepenuhnya, lakukan dari dashboard auth.",
  });
}
