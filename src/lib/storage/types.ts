export interface StorageAdapter {
  /** Create bucket/prefix if needed; verify writability for local. */
  ensureReady(): Promise<void>;
  put(key: string, data: Buffer): Promise<void>;
  get(key: string): Promise<Buffer>;
  /** Delete a single object by key. */
  deleteObject(key: string): Promise<void>;
  /** Delete all objects under prefix (e.g. project folder). */
  deletePrefix(prefix: string): Promise<void>;
}
