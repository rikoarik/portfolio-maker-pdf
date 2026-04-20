import { randomUUID } from "node:crypto";
import { localStorageAdapter } from "@/lib/storage/local";
import { createS3StorageAdapter } from "@/lib/storage/s3";
import { createSupabaseStorageAdapter } from "@/lib/storage/supabase";
import {
  StorageConfigurationError,
  type StorageAdapter,
  type StorageDriver,
} from "@/lib/storage/types";

let cached: StorageAdapter | null = null;
let cachedDriver: StorageDriver | null = null;

/** Thrown when deployed on Vercel without cloud storage (local disk is not writable). */
export class StorageNotConfiguredForServerlessError extends Error {
  readonly code = "storage_unconfigured" as const;
  constructor() {
    super(
      "Penyimpanan file belum dikonfigurasi untuk hosting serverless. Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_STORAGE_BUCKET + SUPABASE_SERVICE_ROLE_KEY (Supabase Storage), atau S3_BUCKET + kredensial. Disk lokal tidak tersedia di Vercel.",
    );
    this.name = "StorageNotConfiguredForServerlessError";
  }
}

function hasValue(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function getMissingEnv(names: string[]): string[] {
  return names.filter((name) => !hasValue(process.env[name]));
}

function hasSupabaseStorage(): boolean {
  return getMissingEnv([
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_STORAGE_BUCKET",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]).length === 0;
}

function hasSupabaseStorageHint(): boolean {
  return (
    hasValue(process.env.SUPABASE_STORAGE_BUCKET) ||
    hasValue(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

function getSupabaseConfigError(): StorageConfigurationError {
  const missingEnv = getMissingEnv([
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_STORAGE_BUCKET",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]);
  return new StorageConfigurationError(
    "supabase",
    `Konfigurasi Supabase Storage belum lengkap. Lengkapi env ini: ${missingEnv.join(", ")}.`,
    missingEnv,
  );
}

function isForcedS3Storage(): boolean {
  return process.env.STORAGE_DRIVER === "s3";
}

function hasS3Storage(): boolean {
  return isForcedS3Storage() || hasValue(process.env.S3_BUCKET);
}

export function getStorageDriver(): StorageDriver {
  if (cachedDriver) return cachedDriver;
  if (isForcedS3Storage()) return "s3";
  if (hasSupabaseStorage()) return "supabase";
  if (hasSupabaseStorageHint()) throw getSupabaseConfigError();
  if (hasS3Storage()) return "s3";
  if (process.env.VERCEL === "1") {
    throw new StorageNotConfiguredForServerlessError();
  }
  return "local";
}

export function getStorage(): StorageAdapter {
  if (cached) return cached;

  const driver = getStorageDriver();
  cachedDriver = driver;

  if (driver === "supabase") {
    cached = createSupabaseStorageAdapter();
  } else if (driver === "s3") {
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
