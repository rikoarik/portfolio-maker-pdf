-- Optional Midtrans package code per plan
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "midtransPackageCode" TEXT;

