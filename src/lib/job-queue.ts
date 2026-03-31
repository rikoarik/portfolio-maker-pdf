import { after } from "next/server";
import { prisma } from "@/lib/db";
import { runAnalyzeJob } from "@/lib/analyze-job";

/**
 * Enqueues analysis: BullMQ when REDIS_URL is set, otherwise Next.js `after()` (single process).
 */
export async function enqueueAnalyzeJob(jobId: string): Promise<void> {
  if (process.env.REDIS_URL) {
    const { addAnalyzeJob } = await import("@/lib/bull-queue");
    await addAnalyzeJob(jobId);
    return;
  }

  after(async () => {
    try {
      await runAnalyzeJob(jobId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Job failed";
      await prisma.job.update({
        where: { id: jobId },
        data: { status: "failed", error: msg },
      });
    }
  });
}
