const prisma = require("../prisma");

/**
 * Writes an immutable audit log entry.
 */
async function createAuditLog({
  actor,
  action,
  entityType,
  entityId,
  module,
  campusId,
  tier,
  before,
  after,
  metadata,
  ipAddress,
  userAgent,
  organizationId,
}) {
  return prisma.auditLog.create({
    data: {
      actorId: actor?.userAccountId || null,
      actorType: actor?.profileType || null,
      actorEmail: actor?.email || null,
      action,
      module: module ?? null,
      entityType,
      entityId: entityId ?? null,
      campusId: campusId ?? null,
      tier: tier ?? null,
      before: before ?? undefined,
      after: after ?? undefined,
      metadata: metadata ?? undefined,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      organizationId: organizationId ?? null,
    },
  });
}

module.exports = { createAuditLog };
