import { createClient } from "@supabase/supabase-js";
import type { StorageAdapter } from "@/lib/storage/types";

function contentTypeForKey(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  return "application/octet-stream";
}

export function createSupabaseStorageAdapter(): StorageAdapter {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim();
  if (!url || !key || !bucket) {
    throw new Error(
      "Supabase Storage membutuhkan NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, dan SUPABASE_STORAGE_BUCKET",
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
        throw new Error(`Supabase Storage upload: ${error.message}`);
      }
    },

    async get(storageKey: string) {
      const { data, error } = await supabase.storage.from(bucket).download(storageKey);
      if (error) {
        throw new Error(`Supabase Storage download: ${error.message}`);
      }
      const ab = await data.arrayBuffer();
      return Buffer.from(ab);
    },

    async deleteObject(storageKey: string) {
      const { error } = await supabase.storage.from(bucket).remove([storageKey]);
      if (error) {
        throw new Error(`Supabase Storage remove: ${error.message}`);
      }
    },

    async deletePrefix(prefix: string) {
      const folder = prefix.replace(/\/$/, "");
      const { data: files, error } = await supabase.storage.from(bucket).list(folder);
      if (error) {
        throw new Error(`Supabase Storage list: ${error.message}`);
      }
      if (!files?.length) return;
      const paths = files.map((f) => `${folder}/${f.name}`);
      const { error: remErr } = await supabase.storage.from(bucket).remove(paths);
      if (remErr) {
        throw new Error(`Supabase Storage remove: ${remErr.message}`);
      }
    },
  };
}
