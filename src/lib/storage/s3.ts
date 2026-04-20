import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  StorageConfigurationError,
  StorageObjectNotFoundError,
  StorageProviderError,
  type StorageAdapter,
} from "@/lib/storage/types";

function client(): S3Client {
  const endpoint = process.env.S3_ENDPOINT;
  return new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: endpoint || undefined,
    forcePathStyle: !!endpoint,
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  });
}

function bucket(): string {
  const b = process.env.S3_BUCKET?.trim();
  if (!b) {
    throw new StorageConfigurationError(
      "s3",
      "Konfigurasi S3 belum lengkap. Lengkapi env ini: S3_BUCKET.",
      ["S3_BUCKET"],
    );
  }
  return b;
}

function isMissingObjectError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "NoSuchKey" ||
    error.message.includes("NoSuchKey") ||
    error.message.includes("NotFound")
  );
}

export function createS3StorageAdapter(): StorageAdapter {
  const s3 = client();
  const b = bucket();

  return {
    async ensureReady() {
      // Bucket must exist (create via console/Terraform)
    },

    async put(key: string, data: Buffer) {
      try {
        await s3.send(
          new PutObjectCommand({
            Bucket: b,
            Key: key.replace(/\\/g, "/"),
            Body: data,
          }),
        );
      } catch (e) {
        throw new StorageProviderError(
          "s3",
          "put",
          "Gagal menulis file ke S3 storage.",
          e instanceof Error ? e.message : String(e),
        );
      }
    },

    async get(key: string) {
      try {
        const out = await s3.send(
          new GetObjectCommand({
            Bucket: b,
            Key: key.replace(/\\/g, "/"),
          }),
        );
        const body = out.Body;
        if (!body) {
          throw new StorageProviderError(
            "s3",
            "get",
            "Body file dari S3 kosong.",
          );
        }
        return Buffer.from(await body.transformToByteArray());
      } catch (e) {
        if (isMissingObjectError(e)) {
          throw new StorageObjectNotFoundError("s3", key);
        }
        if (e instanceof StorageProviderError) throw e;
        throw new StorageProviderError(
          "s3",
          "get",
          "Gagal membaca file dari S3 storage.",
          e instanceof Error ? e.message : String(e),
        );
      }
    },

    async deleteObject(key: string) {
      try {
        const Key = key.replace(/\\/g, "/");
        await s3.send(
          new DeleteObjectCommand({
            Bucket: b,
            Key,
          }),
        );
      } catch (e) {
        throw new StorageProviderError(
          "s3",
          "deleteObject",
          "Gagal menghapus file dari S3 storage.",
          e instanceof Error ? e.message : String(e),
        );
      }
    },

    async deletePrefix(prefix: string) {
      const p = prefix.replace(/\\/g, "/").replace(/\/$/, "");
      let token: string | undefined;
      try {
        do {
          const list = await s3.send(
            new ListObjectsV2Command({
              Bucket: b,
              Prefix: p + "/",
              ContinuationToken: token,
            }),
          );
          const keys = (list.Contents ?? [])
            .map((o) => o.Key)
            .filter((k): k is string => !!k);
          if (keys.length) {
            await s3.send(
              new DeleteObjectsCommand({
                Bucket: b,
                Delete: { Objects: keys.map((Key) => ({ Key })) },
              }),
            );
          }
          token = list.IsTruncated ? list.NextContinuationToken : undefined;
        } while (token);
      } catch (e) {
        throw new StorageProviderError(
          "s3",
          "deletePrefix",
          "Gagal menghapus prefix dari S3 storage.",
          e instanceof Error ? e.message : String(e),
        );
      }
    },
  };
}
