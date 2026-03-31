import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { ensureUploadRoot } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, "ok" | string> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = "ok";
  } catch (e) {
    checks.db = e instanceof Error ? e.message : "error";
  }

  try {
    await ensureUploadRoot();
    const probe = path.join(
      process.cwd(),
      "storage",
      "uploads",
      ".health-probe",
    );
    await fs.writeFile(probe, String(Date.now()));
    await fs.rm(probe, { force: true });
    checks.storage = "ok";
  } catch (e) {
    checks.storage = e instanceof Error ? e.message : "error";
  }

  const ok = checks.db === "ok" && checks.storage === "ok";
  return NextResponse.json(
    { status: ok ? "healthy" : "degraded", checks },
    { status: ok ? 200 : 503 },
  );
}
