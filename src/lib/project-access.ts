import { jsonError } from "@/lib/http";
import { ensurePrismaUser } from "@/lib/auth/sync-user";
import { createClient } from "@/lib/supabase/server";
import type { PortfolioProject } from "@/generated/prisma/client";

/** Current user id from Supabase session, or null if anonymous. */
export async function getSessionUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** Like getSessionUserId but ensures a `User` row exists for FK writes. */
export async function getSessionUserIdSynced(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  await ensurePrismaUser(user);
  return user.id;
}

/**
 * If project is owned, only the owner may access. Unowned projects stay link-accessible.
 */
export async function ensureProjectAccess(
  project: Pick<PortfolioProject, "userId">,
): Promise<Response | null> {
  const uid = await getSessionUserId();
  if (project.userId && project.userId !== uid) {
    return jsonError(403, "forbidden", "You do not have access to this project");
  }
  return null;
}
