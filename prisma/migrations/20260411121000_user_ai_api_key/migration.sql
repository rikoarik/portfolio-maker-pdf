-- Add per-user AI API key for admin-managed overrides.
ALTER TABLE "User"
ADD COLUMN "aiApiKey" TEXT;
