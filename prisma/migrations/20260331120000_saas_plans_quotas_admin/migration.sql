-- Plan catalog (limits configurable; admin can edit rows later)
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stripePriceId" TEXT,
    "maxProjects" INTEGER NOT NULL DEFAULT 5,
    "maxScreenshotsPerProject" INTEGER NOT NULL DEFAULT 20,
    "maxAiAnalysesPerPeriod" INTEGER NOT NULL DEFAULT 15,
    "maxPdfExportsPerPeriod" INTEGER NOT NULL DEFAULT 10,
    "periodDays" INTEGER NOT NULL DEFAULT 30,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Plan_slug_key" ON "Plan"("slug");

INSERT INTO "Plan" ("id", "slug", "name", "maxProjects", "maxScreenshotsPerProject", "maxAiAnalysesPerPeriod", "maxPdfExportsPerPeriod", "periodDays", "sortOrder", "active", "createdAt", "updatedAt")
VALUES
('plan_free_default', 'free', 'Free', 5, 20, 15, 10, 30, 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('plan_pro_default', 'pro', 'Pro', 50, 50, 500, 200, 30, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- User billing / RBAC (idempotent adds for DBs that already have some columns)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tier" TEXT NOT NULL DEFAULT 'FREE';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "paymentCustomerId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "currentPeriodEnd" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "aiUsageCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'USER';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "planId" TEXT;

UPDATE "User" SET "planId" = 'plan_free_default' WHERE "planId" IS NULL;

ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_planId_fkey";
ALTER TABLE "User" ADD CONSTRAINT "User_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "UsageCounter" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "periodKey" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UsageCounter_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UsageCounter_userId_periodKey_metric_key" ON "UsageCounter"("userId", "periodKey", "metric");
CREATE INDEX "UsageCounter_userId_periodKey_idx" ON "UsageCounter"("userId", "periodKey");
ALTER TABLE "UsageCounter" ADD CONSTRAINT "UsageCounter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WebhookEvent_eventId_key" ON "WebhookEvent"("eventId");

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" UUID,
    "action" TEXT NOT NULL,
    "targetUserId" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_targetUserId_idx" ON "AuditLog"("targetUserId");
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PortfolioProject" ADD COLUMN IF NOT EXISTS "jobFocus" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PortfolioProject" ADD COLUMN IF NOT EXISTS "industry" TEXT NOT NULL DEFAULT '';

ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "payload" JSONB NOT NULL DEFAULT '{}';
