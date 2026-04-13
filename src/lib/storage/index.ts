import { randomUUID } from "node:crypto";
import { localStorageAdapter } from "@/lib/storage/local";
import { createS3StorageAdapter } from "@/lib/storage/s3";
import type { StorageAdapter } from "@/lib/storage/types";

let cached: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (cached) return cached;
  if (process.env.STORAGE_DRIVER === "s3" || process.env.S3_BUCKET) {
    cached = createS3StorageAdapter();
  } else {
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
