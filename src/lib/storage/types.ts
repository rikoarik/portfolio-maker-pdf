export type StorageDriver = "local" | "supabase" | "s3";

export type StorageOperation =
  | "ensureReady"
  | "put"
  | "get"
  | "deleteObject"
  | "deletePrefix";

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

export class StorageConfigurationError extends Error {
  readonly code = "storage_misconfigured" as const;

  constructor(
    readonly provider: StorageDriver,
    message: string,
    readonly missingEnv: string[] = [],
  ) {
    super(message);
    this.name = "StorageConfigurationError";
  }
}

export class StorageProviderError extends Error {
  readonly code = "storage_provider_failed" as const;

  constructor(
    readonly provider: StorageDriver,
    readonly operation: StorageOperation,
    message: string,
    readonly causeMessage?: string,
  ) {
    super(message);
    this.name = "StorageProviderError";
  }
}

export class StorageObjectNotFoundError extends Error {
  readonly code = "storage_object_missing" as const;

  constructor(
    readonly provider: StorageDriver,
    readonly storageKey: string,
    message = "File tidak ditemukan di storage.",
  ) {
    super(message);
    this.name = "StorageObjectNotFoundError";
  }
}
