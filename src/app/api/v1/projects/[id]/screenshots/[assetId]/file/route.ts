import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import {
  StorageNotConfiguredForServerlessError,
  readUploadFile,
} from "@/lib/storage";
import {
  StorageConfigurationError,
  StorageObjectNotFoundError,
  StorageProviderError,
} from "@/lib/storage/types";
import { ensureProjectAccess } from "@/lib/project-access";
import { getRequestId } from "@/lib/api-context";
import { logApi } from "@/lib/logger";

type Ctx = { params: Promise<{ id: string; assetId: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const requestId = await getRequestId();
  const { id: projectId, assetId } = await ctx.params;

  const project = await prisma.portfolioProject.findUnique({
    where: { id: projectId },
  });
  if (!project) {
    return jsonError(404, "not_found", "Project not found");
  }
  const denied = await ensureProjectAccess(project);
  if (denied) return denied;

  const asset = await prisma.screenshotAsset.findFirst({
    where: { id: assetId, projectId },
  });
  if (!asset) {
    return jsonError(404, "not_found", "Screenshot not found");
  }

  let buffer: Buffer;
  try {
    buffer = await readUploadFile(asset.storageKey);
  } catch (e) {
    if (e instanceof StorageNotConfiguredForServerlessError) {
      logApi("error", "screenshot_read_failed", {
        requestId,
        projectId,
        path: "GET screenshot file",
        extra: { assetId, reason: e.code },
      });
      return jsonError(503, e.code, e.message);
    }
    if (e instanceof StorageConfigurationError) {
      logApi("error", "screenshot_read_failed", {
        requestId,
        projectId,
        path: "GET screenshot file",
        extra: {
          assetId,
          reason: e.code,
          provider: e.provider,
          missingEnv: e.missingEnv.join(","),
        },
      });
      return jsonError(503, e.code, e.message);
    }
    if (e instanceof StorageObjectNotFoundError) {
      logApi("warn", "screenshot_read_failed", {
        requestId,
        projectId,
        path: "GET screenshot file",
        extra: {
          assetId,
          reason: "screenshot_file_missing",
          provider: e.provider,
          storageKey: e.storageKey,
        },
      });
      return jsonError(404, "screenshot_file_missing", e.message);
    }
    if (e instanceof StorageProviderError) {
      logApi("error", "screenshot_read_failed", {
        requestId,
        projectId,
        path: "GET screenshot file",
        extra: {
          assetId,
          reason: "storage_read_failed",
          provider: e.provider,
          operation: e.operation,
          message: e.causeMessage?.slice(0, 300),
        },
      });
      return jsonError(
        503,
        "storage_read_failed",
        "Gagal membaca screenshot dari storage. Coba lagi beberapa saat.",
      );
    }
    throw e;
  }
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": asset.mime,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
