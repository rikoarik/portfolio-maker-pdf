import { randomUUID } from "node:crypto";
import { localStorageAdapter } from "@/lib/storage/local";
import { createS3StorageAdapter } from "@/lib/storage/s3";
import { createSupabaseStorageAdapter } from "@/lib/storage/supabase";
import type { StorageAdapter } from "@/lib/storage/types";

let cached: StorageAdapter | null = null;

/** Thrown when deployed on Vercel without cloud storage (local disk is not writable). */
export class StorageNotConfiguredForServerlessError extends Error {
  readonly code = "storage_unconfigured" as const;
  constructor() {
    super(
      "Penyimpanan file belum dikonfigurasi untuk hosting serverless. Set SUPABASE_STORAGE_BUCKET + SUPABASE_SERVICE_ROLE_KEY (Supabase Storage), atau S3_BUCKET + kredensial. Disk lokal tidak tersedia di Vercel.",
    );
    this.name = "StorageNotConfiguredForServerlessError";
  }
}

function useSupabaseStorage(): boolean {
  return Boolean(
    process.env.SUPABASE_STORAGE_BUCKET?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

function useS3Storage(): boolean {
  return (
    process.env.STORAGE_DRIVER === "s3" || Boolean(process.env.S3_BUCKET)
  );
}

export function getStorage(): StorageAdapter {
  if (cached) return cached;
  if (useSupabaseStorage()) {
    cached = createSupabaseStorageAdapter();
  } else if (useS3Storage()) {
    cached = createS3StorageAdapter();
  } else {
    if (process.env.VERCEL === "1") {
      throw new StorageNotConfiguredForServerlessError();
    }
    cached = localStorageAdapter;
  }
  return cached;
}

export function storageKeyForProject(projectId: string, ext: string): string {
  const safe = ext.replace(/^\./, "").toLowerCase() || "bin";
  return `${projectId}/${randomUUID()}.${safe}`;
}

export async function ensureUploadRoot(): Promise<void> {
  await getStorage().ensureReady();
}

export async function writeUploadFile(
  storageKey: string,
  data: Buffer,
): Promise<void> {
  await getStorage().put(storageKey, data);
}

export async function readUploadFile(storageKey: string): Promise<Buffer> {
  return getStorage().get(storageKey);
}

export async function deleteUploadFile(storageKey: string): Promise<void> {
  await getStorage().deleteObject(storageKey);
}

export async function deleteProjectFiles(projectId: string): Promise<void> {
  await getStorage().deletePrefix(projectId);
}
