import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ensurePrismaUser, isDbAdmin } from "@/lib/auth/sync-user";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/app/admin/admin-shell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  await ensurePrismaUser(user);
  if (!(await isDbAdmin(user.id))) redirect("/app");

  return <AdminShell userEmail={user.email ?? user.id}>{children}</AdminShell>;
}
