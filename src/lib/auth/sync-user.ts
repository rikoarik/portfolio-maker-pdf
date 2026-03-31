import type { User as SupabaseUser } from "@supabase/supabase-js";
import { prisma } from "@/lib/db";

function resolveRole(supabaseUser: SupabaseUser): string {
  const meta = supabaseUser.app_metadata as Record<string, unknown> | undefined;
  const r = meta?.role;
  if (r === "admin" || r === "ADMIN") return "ADMIN";
  const email = (supabaseUser.email ?? "").toLowerCase();
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (email && admins.includes(email)) return "ADMIN";
  return "USER";
}

/** Keep public.User aligned with auth.users (id + profile fields). */
export async function ensurePrismaUser(supabaseUser: SupabaseUser) {
  const email = supabaseUser.email ?? "";
  const name =
    (supabaseUser.user_metadata?.name as string | undefined) ?? null;
  const role = resolveRole(supabaseUser);

  const freePlan = await prisma.plan.findUnique({ where: { slug: "free" } });

  const existing = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
  });

  await prisma.user.upsert({
    where: { id: supabaseUser.id },
    create: {
      id: supabaseUser.id,
      email,
      name,
      role,
      planId: freePlan?.id ?? undefined,
      tier: "FREE",
    },
    update: {
      email,
      name,
      role,
      ...(existing?.planId || !freePlan ? {} : { planId: freePlan.id }),
    },
  });
}

export async function isDbAdmin(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return u?.role === "ADMIN";
}
