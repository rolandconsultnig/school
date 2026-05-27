const prisma = require("../prisma");
const { LEGACY_ROLE_MAP } = require("./permissions");

/**
 * Resolves the authenticated actor from JWT id (legacy Admin/Teacher/Student tables).
 */
async function resolveActor(userId) {
  const admin = await prisma.admin.findUnique({ where: { id: userId } });
  if (admin) {
    const account = await prisma.userAccount.findFirst({
      where: { profileType: "ADMIN", profileId: admin.id },
    });
    let roleCode = LEGACY_ROLE_MAP[admin.role] || "SCHOOL_ADMIN";
    let userAccountId;
    if (account) {
      userAccountId = account.id;
      const assignment = await prisma.userRoleAssignment.findFirst({
        where: { userAccountId: account.id },
        include: { role: true },
      });
      if (assignment?.role?.code) roleCode = assignment.role.code;
    }
    return {
      profileType: "ADMIN",
      profileId: admin.id,
      email: admin.email,
      legacyRole: admin.role,
      roleCode,
      userAccountId,
    };
  }

  const teacher = await prisma.teacher.findUnique({ where: { id: userId } });
  if (teacher) {
    return {
      profileType: "TEACHER",
      profileId: teacher.id,
      email: teacher.email,
      legacyRole: teacher.role,
      roleCode: LEGACY_ROLE_MAP[teacher.role] || "TEACHER",
    };
  }

  const student = await prisma.student.findUnique({ where: { id: userId } });
  if (student) {
    return {
      profileType: "STUDENT",
      profileId: student.id,
      email: student.email,
      legacyRole: student.role,
      roleCode: LEGACY_ROLE_MAP[student.role] || "STUDENT",
      campusId: student.campusId,
      tier: student.tier,
    };
  }

  const parent = await prisma.parent.findUnique({ where: { id: userId } });
  if (parent) {
    return {
      profileType: "PARENT",
      profileId: parent.id,
      email: parent.email,
      legacyRole: parent.role,
      roleCode: "PARENT",
      campusId: parent.campusId,
    };
  }

  const account = await prisma.userAccount.findUnique({ where: { id: userId } });
  if (account) {
    const assignment = await prisma.userRoleAssignment.findFirst({
      where: { userAccountId: account.id },
      include: { role: true },
    });
    return {
      profileType: account.profileType,
      profileId: account.profileId,
      email: account.email,
      roleCode: assignment?.role?.code,
      userAccountId: account.id,
    };
  }

  return null;
}

module.exports = { resolveActor };
