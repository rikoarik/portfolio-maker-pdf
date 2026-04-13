import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { StorageAdapter } from "@/lib/storage/types";

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
  const b = process.env.S3_BUCKET;
  if (!b) throw new Error("S3_BUCKET is not set");
  return b;
}

export function createS3StorageAdapter(): StorageAdapter {
  const s3 = client();
  const b = bucket();

  return {
    async ensureReady() {
      // Bucket must exist (create via console/Terraform)
    },

    async put(key: string, data: Buffer) {
      await s3.send(
        new PutObjectCommand({
          Bucket: b,
          Key: key.replace(/\\/g, "/"),
          Body: data,
        }),
      );
    },

    async get(key: string) {
      const out = await s3.send(
        new GetObjectCommand({
          Bucket: b,
          Key: key.replace(/\\/g, "/"),
        }),
      );
      const body = out.Body;
      if (!body) throw new Error("Empty S3 body");
      return Buffer.from(await body.transformToByteArray());
    },

    async deleteObject(key: string) {
      const Key = key.replace(/\\/g, "/");
      await s3.send(
        new DeleteObjectCommand({
          Bucket: b,
          Key,
        }),
      );
    },

    async deletePrefix(prefix: string) {
      const p = prefix.replace(/\\/g, "/").replace(/\/$/, "");
      let token: string | undefined;
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
    },
  };
}
