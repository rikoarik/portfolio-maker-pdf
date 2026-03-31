/**
 * Run with: REDIS_URL=... DATABASE_URL=... npx tsx src/worker.ts
 * Processes BullMQ "analyze" jobs (same logic as after() fallback).
 */
import "dotenv/config";
import { Worker } from "bullmq";
import { runAnalyzeJob } from "./lib/analyze-job";
import { prisma } from "./lib/db";

const url = process.env.REDIS_URL;
if (!url) {
  console.error("REDIS_URL is required for the worker");
  process.exit(1);
}

const worker = new Worker(
  "analyze",
  async (job) => {
    const { jobId } = job.data as { jobId: string };
    await runAnalyzeJob(jobId);
  },
  {
    connection: { url },
    concurrency: 2,
  },
);

worker.on("failed", async (job, err) => {
  const jobId = (job?.data as { jobId?: string })?.jobId;
  if (jobId) {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "failed",
        error: err instanceof Error ? err.message : "Job failed",
      },
    });
  }
});

console.log("Analyze worker started (queue: analyze)");
