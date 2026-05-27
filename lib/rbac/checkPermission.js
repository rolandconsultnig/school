const prisma = require("../prisma");
const { ROLE_PERMISSIONS } = require("./permissions");

/**
 * Returns true if roleCode holds the given permission (DB first, then static fallback).
 */
async function roleHasPermission(roleCode, permissionCode) {
  if (!roleCode) return false;

  const role = await prisma.role.findUnique({
    where: { code: roleCode },
    include: {
      permissions: {
        include: { permission: true },
      },
    },
  });

  if (role?.permissions?.length) {
    return role.permissions.some((rp) => rp.permission.code === permissionCode);
  }

  const staticPerms = ROLE_PERMISSIONS[roleCode] || [];
  return staticPerms.includes(permissionCode);
}

/**
 * Checks permission for an actor (from resolveActor).
 */
async function checkPermission(actor, permissionCode, { campusId, tier } = {}) {
  if (!actor) return false;

  // Explicit assignments override legacy role mapping
  const orConditions = [
    {
      legacyProfileType: actor.profileType,
      legacyProfileId: actor.profileId,
    },
  ];
  if (actor.userAccountId) {
    orConditions.unshift({ userAccountId: actor.userAccountId });
  }

  const assignments = await prisma.userRoleAssignment.findMany({
    where: { OR: orConditions },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  });

  if (assignments.length) {
    return assignments.some((a) => {
      if (campusId && a.campusId && a.campusId !== campusId) return false;
      if (tier && a.tier && a.tier !== tier) return false;
      return a.role.permissions.some((rp) => rp.permission.code === permissionCode);
    });
  }

  return roleHasPermission(actor.roleCode, permissionCode);
}

module.exports = { checkPermission, roleHasPermission };
