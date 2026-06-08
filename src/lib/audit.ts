import { prisma } from "@/lib/prisma";
import type { AuditAction } from "@prisma/client";

export async function logAudit(params: {
  actorId?: string | null;
  action: AuditAction;
  subject: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.auditLog.create({
    data: {
      actorId: params.actorId ?? null,
      action: params.action,
      subject: params.subject,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}
