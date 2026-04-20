import { createClient } from "@supabase/supabase-js";
import {
  StorageConfigurationError,
  StorageObjectNotFoundError,
  StorageProviderError,
  type StorageAdapter,
} from "@/lib/storage/types";

function contentTypeForKey(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  return "application/octet-stream";
}

function getMissingSupabaseEnv(): string[] {
  return [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_STORAGE_BUCKET",
  ].filter((name) => !process.env[name]?.trim());
}

export function createSupabaseStorageAdapter(): StorageAdapter {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim();
  const missingEnv = getMissingSupabaseEnv();
  if (!url || !key || !bucket) {
    throw new StorageConfigurationError(
      "supabase",
      `Konfigurasi Supabase Storage belum lengkap. Lengkapi env ini: ${missingEnv.join(", ")}.`,
      missingEnv,
    );
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    async ensureReady() {
      // Bucket harus sudah dibuat di Dashboard → Storage
    },

    async put(storageKey: string, data: Buffer) {
      const { error } = await supabase.storage.from(bucket).upload(storageKey, data, {
        upsert: true,
        contentType: contentTypeForKey(storageKey),
      });
      if (error) {
        throw new StorageProviderError(
          "supabase",
          "put",
          "Gagal menulis file ke Supabase Storage.",
          error.message,
        );
      }
    },

    async get(storageKey: string) {
      const { data, error } = await supabase.storage.from(bucket).download(storageKey);
      if (error) {
        if (
          error.message.toLowerCase().includes("not found") ||
          error.message.toLowerCase().includes("does not exist")
        ) {
          throw new StorageObjectNotFoundError("supabase", storageKey);
        }
        throw new StorageProviderError(
          "supabase",
          "get",
          "Gagal membaca file dari Supabase Storage.",
          error.message,
        );
      }
      const ab = await data.arrayBuffer();
      return Buffer.from(ab);
    },

    async deleteObject(storageKey: string) {
      const { error } = await supabase.storage.from(bucket).remove([storageKey]);
      if (error) {
        throw new StorageProviderError(
          "supabase",
          "deleteObject",
          "Gagal menghapus file dari Supabase Storage.",
          error.message,
        );
      }
    },

    async deletePrefix(prefix: string) {
      const folder = prefix.replace(/\/$/, "");
      const { data: files, error } = await supabase.storage.from(bucket).list(folder);
      if (error) {
        throw new StorageProviderError(
          "supabase",
          "deletePrefix",
          "Gagal membaca daftar file Supabase Storage.",
          error.message,
        );
      }
      if (!files?.length) return;
      const paths = files.map((f) => `${folder}/${f.name}`);
      const { error: remErr } = await supabase.storage.from(bucket).remove(paths);
      if (remErr) {
        throw new StorageProviderError(
          "supabase",
          "deletePrefix",
          "Gagal menghapus file Supabase Storage.",
          remErr.message,
        );
      }
    },
  };
}
