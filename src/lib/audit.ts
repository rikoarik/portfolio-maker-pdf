import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export async function writeAuditLog(args: {
  actorUserId: string | null;
  action: string;
  targetUserId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorUserId: args.actorUserId,
      action: args.action,
      targetUserId: args.targetUserId ?? null,
      metadata: (args.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}
