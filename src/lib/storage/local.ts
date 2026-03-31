import fs from "node:fs/promises";
import path from "node:path";
import type { StorageAdapter } from "@/lib/storage/types";

const UPLOAD_ROOT = path.join(process.cwd(), "storage", "uploads");

function abs(key: string): string {
  return path.join(UPLOAD_ROOT, key);
}

export const localStorageAdapter: StorageAdapter = {
  async ensureReady() {
    await fs.mkdir(UPLOAD_ROOT, { recursive: true });
  },

  async put(key: string, data: Buffer) {
    await fs.mkdir(UPLOAD_ROOT, { recursive: true });
    const p = abs(key);
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, data);
  },

  async get(key: string) {
    return fs.readFile(abs(key));
  },

  async deletePrefix(prefix: string) {
    const dir = path.join(UPLOAD_ROOT, prefix);
    await fs.rm(dir, { recursive: true, force: true });
  },
};
