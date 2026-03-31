import { jsonError } from "@/lib/http";
import { isDbAdmin } from "@/lib/auth/sync-user";
import { getSessionUserIdSynced } from "@/lib/project-access";

export type AdminAuthOk = { ok: true; userId: string };
export type AdminAuthFail = { ok: false; response: Response };

export async function requireAdmin(): Promise<AdminAuthOk | AdminAuthFail> {
  const userId = await getSessionUserIdSynced();
  if (!userId) {
    return { ok: false, response: jsonError(401, "unauthorized", "Login required") };
  }
  if (!(await isDbAdmin(userId))) {
    return { ok: false, response: jsonError(403, "forbidden", "Admin only") };
  }
  return { ok: true, userId };
}
