const {
  hashPassword,
  isPassMatched,
} = require("../../handlers/passHash.handler");
const responseStatus = require("../../handlers/responseStatus.handler");
const prisma = require("../../lib/prisma");
const generateToken = require("../../utils/tokenGenerator");
const { serializeForApi } = require("../../utils/serialize");

const adminProfileInclude = {
  academicTerms: { include: { academicTerm: true } },
  programs: { include: { program: true } },
  academicYears: { include: { academicYear: true } },
  yearGroups: { include: { yearGroup: true } },
  teachers: { include: { teacher: true } },
  classLevels: { include: { classLevel: true } },
  students: { include: { student: true } },
};

function flattenAdminProfile(admin) {
  const serialized = serializeForApi(admin);
  return {
    ...serialized,
    academicTerms: admin.academicTerms?.map((r) =>
      serializeForApi(r.academicTerm)
    ),
    programs: admin.programs?.map((r) => serializeForApi(r.program)),
    academicYears: admin.academicYears?.map((r) =>
      serializeForApi(r.academicYear)
    ),
    yearGroups: admin.yearGroups?.map((r) => serializeForApi(r.yearGroup)),
    teachers: admin.teachers?.map((r) => serializeForApi(r.teacher)),
    classLevel: admin.classLevels?.map((r) => serializeForApi(r.classLevel)),
    students: admin.students?.map((r) => serializeForApi(r.student)),
  };
}

exports.registerAdminService = async (data, res) => {
  const { name, email, password } = data;

  const isAdminExist = await prisma.admin.findUnique({ where: { email } });
  if (isAdminExist) {
    return responseStatus(res, 401, "failed", "Email Already in use");
  }

  await prisma.admin.create({
    data: {
      name,
      email,
      password: await hashPassword(password),
    },
  });
  return responseStatus(res, 201, "success", "Registration Successful!");
};

exports.loginAdminService = async (data, res) => {
  const { email, password } = data;
  const user = await prisma.admin.findUnique({ where: { email } });
  if (!user)
    return responseStatus(res, 405, "failed", "Invalid login credentials");

  const isPassValid = await isPassMatched(password, user.password);
  if (!isPassValid) {
    return responseStatus(res, 405, "failed", "Invalid login credentials");
  }

  const result = {
    user: serializeForApi(user),
    token: generateToken(user.id),
  };
  return responseStatus(res, 200, "success", result);
};

exports.getAdminsService = async () => {
  const admins = await prisma.admin.findMany();
  return admins.map((a) => serializeForApi(a));
};

exports.getSingleProfileService = async (id, res) => {
  const user = await prisma.admin.findUnique({
    where: { id },
    include: adminProfileInclude,
  });

  if (!user) {
    return responseStatus(res, 201, "failed", "Admin doesn't exist ");
  }
  return responseStatus(res, 201, "success", flattenAdminProfile(user));
};

exports.updateAdminService = async (id, data, res) => {
  const { email, name, password } = data;

  const emailTaken = await prisma.admin.findFirst({
    where: { email, NOT: { id } },
  });
  if (emailTaken) {
    return responseStatus(res, 401, "failed", "Email is already in use");
  }

  const updateData = password
    ? { name, email, password: await hashPassword(password) }
    : { email, name };

  const updateResult = await prisma.admin.update({
    where: { id },
    data: updateData,
  });
  return responseStatus(res, 201, "success", serializeForApi(updateResult));
};

/** First-time setup when no admins exist (public). */
exports.bootstrapAdminService = async (data, res) => {
  const count = await prisma.admin.count();
  if (count > 0) {
    return responseStatus(
      res,
      403,
      "failed",
      "Setup already completed. Use admin login or register with an existing admin."
    );
  }

  const { name, email, password } = data;
  if (!name || !email || !password) {
    return responseStatus(res, 400, "failed", "name, email, and password are required");
  }

  const admin = await prisma.admin.create({
    data: {
      name,
      email,
      password: await hashPassword(password),
    },
  });

  const superRole = await prisma.role.findUnique({ where: { code: "SUPER_ADMIN" } });
  if (superRole) {
    const account = await prisma.userAccount.create({
      data: {
        email,
        password: admin.password,
        profileType: "ADMIN",
        profileId: admin.id,
      },
    });
    await prisma.userRoleAssignment.create({
      data: { userAccountId: account.id, roleId: superRole.id },
    });
  }

  return responseStatus(res, 201, "success", {
    message: "Initial admin created",
    admin: serializeForApi(admin),
    token: generateToken(admin.id),
  });
};

exports.deleteAdminService = async (targetId, requestingAdminId, res) => {
  if (targetId === requestingAdminId) {
    return responseStatus(res, 400, "failed", "You cannot delete your own account");
  }

  const adminCount = await prisma.admin.count();
  if (adminCount <= 1) {
    return responseStatus(res, 400, "failed", "Cannot delete the last admin account");
  }

  const existing = await prisma.admin.findUnique({ where: { id: targetId } });
  if (!existing) {
    return responseStatus(res, 404, "failed", "Admin not found");
  }

  await prisma.$transaction([
    prisma.adminStudent.deleteMany({ where: { adminId: targetId } }),
    prisma.adminTeacher.deleteMany({ where: { adminId: targetId } }),
    prisma.adminAcademicTerm.deleteMany({ where: { adminId: targetId } }),
    prisma.adminProgram.deleteMany({ where: { adminId: targetId } }),
    prisma.adminYearGroup.deleteMany({ where: { adminId: targetId } }),
    prisma.adminAcademicYear.deleteMany({ where: { adminId: targetId } }),
    prisma.adminClassLevel.deleteMany({ where: { adminId: targetId } }),
    prisma.userRoleAssignment.deleteMany({
      where: {
        legacyProfileType: "ADMIN",
        legacyProfileId: targetId,
      },
    }),
    prisma.userAccount.deleteMany({
      where: { profileType: "ADMIN", profileId: targetId },
    }),
    prisma.admin.delete({ where: { id: targetId } }),
  ]);

  return responseStatus(res, 200, "success", serializeForApi(existing));
};
