import fs from "node:fs/promises";
import path from "node:path";
import {
  StorageObjectNotFoundError,
  StorageProviderError,
  type StorageAdapter,
} from "@/lib/storage/types";

const UPLOAD_ROOT = path.join(process.cwd(), "storage", "uploads");

function abs(key: string): string {
  return path.join(UPLOAD_ROOT, key);
}

export const localStorageAdapter: StorageAdapter = {
  async ensureReady() {
    await fs.mkdir(UPLOAD_ROOT, { recursive: true });
  },

  async put(key: string, data: Buffer) {
    try {
      await fs.mkdir(UPLOAD_ROOT, { recursive: true });
      const p = abs(key);
      await fs.mkdir(path.dirname(p), { recursive: true });
      await fs.writeFile(p, data);
    } catch (e) {
      throw new StorageProviderError(
        "local",
        "put",
        "Gagal menulis file ke local storage.",
        e instanceof Error ? e.message : String(e),
      );
    }
  },

  async get(key: string) {
    try {
      return await fs.readFile(abs(key));
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code;
      if (code === "ENOENT") {
        throw new StorageObjectNotFoundError("local", key);
      }
      throw new StorageProviderError(
        "local",
        "get",
        "Gagal membaca file dari local storage.",
        e instanceof Error ? e.message : String(e),
      );
    }
  },

  async deleteObject(key: string) {
    try {
      await fs.unlink(abs(key));
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") {
        throw new StorageProviderError(
          "local",
          "deleteObject",
          "Gagal menghapus file dari local storage.",
          e instanceof Error ? e.message : String(e),
        );
      }
    }
  },

  async deletePrefix(prefix: string) {
    try {
      const dir = path.join(UPLOAD_ROOT, prefix);
      await fs.rm(dir, { recursive: true, force: true });
    } catch (e) {
      throw new StorageProviderError(
        "local",
        "deletePrefix",
        "Gagal menghapus folder local storage.",
        e instanceof Error ? e.message : String(e),
      );
    }
  },
};
