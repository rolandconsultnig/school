const prisma = require("../../lib/prisma");
const { MODULES, SCHOOL_TIERS, TIER_LABELS } = require("../../lib/modules");
const { serializeForApi } = require("../../utils/serialize");
const responseStatus = require("../../handlers/responseStatus.handler");

exports.getModuleRegistryService = () => ({
  modules: Object.entries(MODULES).map(([key, id]) => ({ id, key })),
  tiers: SCHOOL_TIERS.map((tier) => ({
    tier,
    label: TIER_LABELS[tier],
  })),
});

exports.getTiersService = async () => {
  const grades = await prisma.gradeLevel.findMany({
    where: { campusId: null },
    orderBy: { sortOrder: "asc" },
  });

  return SCHOOL_TIERS.map((tier) => ({
    tier,
    label: TIER_LABELS[tier],
    grades: grades
      .filter((g) => g.tier === tier)
      .map((g) => serializeForApi(g)),
  }));
};

exports.getGradesByTierService = async (tier, res) => {
  if (!SCHOOL_TIERS.includes(tier)) {
    return responseStatus(res, 400, "failed", "Invalid tier. Use NURSERY, PRIMARY, or SECONDARY");
  }

  const grades = await prisma.gradeLevel.findMany({
    where: { tier, campusId: null },
    orderBy: { sortOrder: "asc" },
  });

  return responseStatus(res, 200, "success", {
    tier,
    label: TIER_LABELS[tier],
    grades: grades.map((g) => serializeForApi(g)),
  });
};

exports.getBootstrapService = async () => {
  const organizations = await prisma.organization.findMany({
    where: { isActive: true },
    include: {
      campuses: {
        where: { isActive: true },
        include: { tiers: true },
      },
    },
  });

  return {
    tiers: SCHOOL_TIERS.map((tier) => ({
      tier,
      label: TIER_LABELS[tier],
    })),
    organizations: organizations.map((o) => serializeForApi(o)),
  };
};

exports.listOrganizationsService = async () => {
  const orgs = await prisma.organization.findMany({
    include: { campuses: { include: { tiers: true } } },
  });
  return orgs.map((o) => serializeForApi(o));
};

exports.getOrganizationService = async (id) => {
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      campuses: {
        include: { tiers: true, gradeLevels: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
  return serializeForApi(org);
};

exports.createOrganizationService = async (data, res) => {
  const { name, slug, country } = data;
  const existing = await prisma.organization.findUnique({ where: { slug } });
  if (existing) {
    return responseStatus(res, 409, "failed", "Organization slug already exists");
  }

  const org = await prisma.organization.create({
    data: { name, slug, country: country || "NG" },
  });
  return responseStatus(res, 201, "success", serializeForApi(org));
};

exports.createCampusService = async (organizationId, data, res) => {
  const { name, code, address, city, state, tiers } = data;

  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) return responseStatus(res, 404, "failed", "Organization not found");

  const tierList = (tiers || SCHOOL_TIERS).filter((t) => SCHOOL_TIERS.includes(t));

  const campus = await prisma.campus.create({
    data: {
      organizationId,
      name,
      code,
      address,
      city,
      state,
      tiers: {
        create: tierList.map((tier) => ({ tier })),
      },
    },
    include: { tiers: true },
  });

  return responseStatus(res, 201, "success", serializeForApi(campus));
};

exports.listRolesService = async () => {
  const roles = await prisma.role.findMany({
    include: {
      permissions: { include: { permission: true } },
    },
  });
  return roles.map((r) => ({
    ...serializeForApi(r),
    permissions: r.permissions.map((rp) => rp.permission.code),
  }));
};

exports.listAuditLogsService = async ({ campusId, limit = 50, cursor }) => {
  return prisma.auditLog.findMany({
    where: campusId ? { campusId } : undefined,
    take: limit,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    orderBy: { createdAt: "desc" },
  });
};

const { queueNotification } = require("./notification.service");

exports.queueNotificationService = async (data, res) => {
  const { channel, recipient, subject, body, campusId, scheduledAt } = data;

  const item = await queueNotification({
    channel,
    recipient,
    subject,
    body,
    campusId,
    scheduledAt,
  });

  return responseStatus(res, 201, "success", serializeForApi(item));
};
