import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/http";

export async function POST(req: NextRequest) {
  let email = "";
  try {
    const j = (await req.json()) as { email?: unknown };
    if (typeof j?.email === "string") email = j.email.trim();
  } catch {
    return jsonError(400, "invalid_json", "Body harus JSON.");
  }
  if (!email || !email.includes("@")) {
    return jsonError(400, "invalid_email", "Email tidak valid.");
  }

  const origin =
    req.headers.get("origin")?.startsWith("http")
      ? req.headers.get("origin")!.replace(/\/$/, "")
      : process.env.NEXT_PUBLIC_APP_URL?.startsWith("http")
        ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
        : process.env.VERCEL_URL
          ? (process.env.VERCEL_URL.startsWith("http")
              ? process.env.VERCEL_URL
              : `https://${process.env.VERCEL_URL}`
            ).replace(/\/$/, "")
          : "http://localhost:3000";

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });
  if (error) {
    // Jangan bocorkan apakah email terdaftar atau tidak
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: true });
}

