import { Queue } from "bullmq";

const ANALYZE_QUEUE = "analyze";

let queue: Queue | null = null;

function getQueue(): Queue {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not set");
  if (!queue) {
    queue = new Queue(ANALYZE_QUEUE, {
      connection: { url },
    });
  }
  return queue;
}

export async function addAnalyzeJob(jobId: string): Promise<void> {
  const q = getQueue();
  await q.add(
    "run",
    { jobId },
    {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 2,
      backoff: { type: "exponential", delay: 3000 },
    },
  );
}
