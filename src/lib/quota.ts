import { MAX_SCREENSHOTS_PER_PROJECT } from "@/lib/constants";
import { prisma } from "@/lib/db";

export type QuotaMetric = "ai_analysis" | "pdf_export";
export type UsageSnapshot = {
  periodKey: string;
  periodLabel: string;
  ai_analysis: number;
  pdf_export: number;
};

export class QuotaExceededError extends Error {
  readonly code = "quota_exceeded";
  constructor(message: string) {
    super(message);
    this.name = "QuotaExceededError";
  }
}

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

function ymdUtc(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
}

function resolveSubscriptionPeriodBounds(
  nowMs: number,
  anchorEndMs: number,
  periodDays: number,
): { start: Date; end: Date } {
  const periodMs = Math.max(1, periodDays) * 24 * 60 * 60 * 1000;
  let periodEndMs = anchorEndMs;
  if (nowMs > periodEndMs) {
    const steps = Math.floor((nowMs - periodEndMs) / periodMs) + 1;
    periodEndMs += steps * periodMs;
  } else if (nowMs <= periodEndMs - periodMs) {
    const stepsBack = Math.floor((periodEndMs - periodMs - nowMs) / periodMs) + 1;
    periodEndMs -= stepsBack * periodMs;
  }
  const periodStartMs = periodEndMs - periodMs;
  return {
    start: new Date(periodStartMs),
    end: new Date(periodEndMs),
  };
}

export async function resolveUsagePeriod(userId: string): Promise<{
  periodKey: string;
  periodLabel: string;
}> {
  const user = await getUserWithPlan(userId);
  if (!user) {
    const key = currentUsagePeriodKey();
    return { periodKey: key, periodLabel: `Kalender UTC (${key})` };
  }
  const days = user.plan?.periodDays ?? 30;
  if (user.currentPeriodEnd && days > 0) {
    const { start, end } = resolveSubscriptionPeriodBounds(
      Date.now(),
      user.currentPeriodEnd.getTime(),
      days,
    );
    return {
      periodKey: `sub:${ymdUtc(start)}:${ymdUtc(end)}`,
      periodLabel: `${ymdUtc(start)} s/d ${ymdUtc(end)} (UTC)`,
    };
  }
  const key = currentUsagePeriodKey();
  return { periodKey: key, periodLabel: `Kalender UTC (${key})` };
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
  const { periodKey } = await resolveUsagePeriod(userId);
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
  const { periodKey } = await resolveUsagePeriod(userId);
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
  const { periodKey } = await resolveUsagePeriod(userId);
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

export async function getUsageSnapshot(userId: string): Promise<UsageSnapshot> {
  const { periodKey, periodLabel } = await resolveUsagePeriod(userId);
  const [aiUsed, pdfUsed] = await Promise.all([
    getUsageCount(userId, periodKey, "ai_analysis"),
    getUsageCount(userId, periodKey, "pdf_export"),
  ]);
  return {
    periodKey,
    periodLabel,
    ai_analysis: aiUsed,
    pdf_export: pdfUsed,
  };
}
