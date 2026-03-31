-- Align public.User with Supabase auth.users (UUID id, no local password).

-- DropForeignKey
ALTER TABLE "PortfolioProject" DROP CONSTRAINT "PortfolioProject_userId_fkey";

-- Clear legacy user links (cuid ids are not valid UUIDs).
UPDATE "PortfolioProject" SET "userId" = NULL;
DELETE FROM "User";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Alter column type for FK
ALTER TABLE "PortfolioProject" ALTER COLUMN "userId" TYPE UUID USING (
  CASE WHEN "userId" IS NULL THEN NULL ELSE "userId"::uuid END
);

-- AddForeignKey
ALTER TABLE "PortfolioProject" ADD CONSTRAINT "PortfolioProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
