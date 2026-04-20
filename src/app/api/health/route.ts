import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import {
  ensureUploadRoot,
  getStorageDriver,
  StorageNotConfiguredForServerlessError,
} from "@/lib/storage";
import {
  StorageConfigurationError,
  StorageProviderError,
} from "@/lib/storage/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, "ok" | string> = {};
  const details: Record<string, string> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = "ok";
  } catch (e) {
    checks.db = e instanceof Error ? e.message : "error";
  }

  try {
    const driver = getStorageDriver();
    details.storageDriver = driver;
    await ensureUploadRoot();

    if (driver === "local") {
      const probe = path.join(
        process.cwd(),
        "storage",
        "uploads",
        ".health-probe",
      );
      await fs.writeFile(probe, String(Date.now()));
      await fs.rm(probe, { force: true });
    }

    checks.storage = "ok";
  } catch (e) {
    if (e instanceof StorageNotConfiguredForServerlessError) {
      details.storageDriver = "unconfigured";
      checks.storage = `${e.code}: ${e.message}`;
    } else if (e instanceof StorageConfigurationError) {
      details.storageDriver = e.provider;
      checks.storage = `${e.code}: ${e.message}`;
    } else if (e instanceof StorageProviderError) {
      details.storageDriver = e.provider;
      checks.storage = `${e.code}: ${e.message}`;
    } else {
      checks.storage = e instanceof Error ? e.message : "error";
    }
  }

  const ok = checks.db === "ok" && checks.storage === "ok";
  return NextResponse.json(
    { status: ok ? "healthy" : "degraded", checks, details },
    { status: ok ? 200 : 503 },
  );
}
