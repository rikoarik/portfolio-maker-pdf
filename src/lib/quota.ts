import { MAX_SCREENSHOTS_PER_PROJECT } from "@/lib/constants";
import { prisma } from "@/lib/db";

export type QuotaMetric = "ai_analysis" | "pdf_export";

export class QuotaExceededError extends Error {
  readonly code = "quota_exceeded";
  constructor(message: string) {
    super(message);
    this.name = "QuotaExceededError";
  }
}

/** UTC month bucket for usage (v1; can later align to subscription period). */
export function currentUsagePeriodKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function getUserWithPlan(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { plan: true },
  });
}

async function effectivePlanForUser(userId: string) {
  const u = await getUserWithPlan(userId);
  if (!u) return null;
  if (u.plan) return u.plan;
  const free = await prisma.plan.findUnique({ where: { slug: "free" } });
  return free;
}

export async function countUserProjects(userId: string): Promise<number> {
  return prisma.portfolioProject.count({ where: { userId } });
}

export async function getUsageCount(
  userId: string,
  periodKey: string,
  metric: QuotaMetric,
): Promise<number> {
  const row = await prisma.usageCounter.findUnique({
    where: {
      userId_periodKey_metric: { userId, periodKey, metric },
    },
  });
  return row?.count ?? 0;
}

export async function incrementUsage(
  userId: string,
  metric: QuotaMetric,
  delta: number = 1,
): Promise<void> {
  const periodKey = currentUsagePeriodKey();
  await prisma.usageCounter.upsert({
    where: {
      userId_periodKey_metric: { userId, periodKey, metric },
    },
    create: { userId, periodKey, metric, count: delta },
    update: { count: { increment: delta } },
  });
}

export async function assertCanCreateProject(userId: string): Promise<void> {
  const plan = await effectivePlanForUser(userId);
  if (!plan) throw new QuotaExceededError("Akun tidak ditemukan.");
  const n = await countUserProjects(userId);
  if (n >= plan.maxProjects) {
    throw new QuotaExceededError(
      `Batas proyek tercapai (${plan.maxProjects}). Upgrade paket atau hapus proyek lama.`,
    );
  }
}

export async function assertCanAddScreenshots(
  userId: string,
  currentScreenshotCount: number,
  filesToAdd: number,
  absoluteMax: number = MAX_SCREENSHOTS_PER_PROJECT,
): Promise<void> {
  const plan = await effectivePlanForUser(userId);
  if (!plan) throw new QuotaExceededError("Akun tidak ditemukan.");
  const cap = Math.min(plan.maxScreenshotsPerProject, absoluteMax);
  if (currentScreenshotCount + filesToAdd > cap) {
    throw new QuotaExceededError(
      `Maksimal ${cap} screenshot per proyek untuk paket Anda.`,
    );
  }
}

export async function assertCanRunAiAnalysis(userId: string): Promise<void> {
  const plan = await effectivePlanForUser(userId);
  if (!plan) throw new QuotaExceededError("Akun tidak ditemukan.");
  const periodKey = currentUsagePeriodKey();
  const used = await getUsageCount(userId, periodKey, "ai_analysis");
  if (used >= plan.maxAiAnalysesPerPeriod) {
    throw new QuotaExceededError(
      `Kuota analisis AI bulan ini habis (${plan.maxAiAnalysesPerPeriod}). Upgrade paket atau tunggu periode berikutnya.`,
    );
  }
}

export async function assertCanExportPdf(userId: string): Promise<void> {
  const plan = await effectivePlanForUser(userId);
  if (!plan) throw new QuotaExceededError("Akun tidak ditemukan.");
  const periodKey = currentUsagePeriodKey();
  const used = await getUsageCount(userId, periodKey, "pdf_export");
  if (used >= plan.maxPdfExportsPerPeriod) {
    throw new QuotaExceededError(
      `Kuota unduhan PDF bulan ini habis (${plan.maxPdfExportsPerPeriod}). Upgrade paket.`,
    );
  }
}

/** Assign default free plan to user if missing (after signup sync). */
export async function ensureUserPlanAssigned(userId: string): Promise<void> {
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u || u.planId) return;
  const free = await prisma.plan.findUnique({ where: { slug: "free" } });
  if (!free) return;
  await prisma.user.update({
    where: { id: userId },
    data: { planId: free.id, tier: "FREE" },
  });
}
