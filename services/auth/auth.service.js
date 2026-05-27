const prisma = require("../../lib/prisma");
const {
  hashPassword,
  isPassMatched,
} = require("../../handlers/passHash.handler");
const generateToken = require("../../utils/tokenGenerator");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");
const { LEGACY_ROLE_MAP } = require("../../lib/rbac/permissions");

async function loginProfile(type, record) {
  return {
    profileType: type,
    profileId: record.id,
    email: record.email,
    name: record.name,
    role: record.role,
    roleCode:
      LEGACY_ROLE_MAP[record.role] ||
      (type === "PARENT" ? "PARENT" : type),
    token: generateToken(record.id),
  };
}

exports.unifiedLoginService = async (data, res) => {
  const { email, password } = data;
  if (!email || !password) {
    return responseStatus(res, 400, "failed", "email and password required");
  }

  const account = await prisma.userAccount.findUnique({ where: { email } });
  if (account?.password) {
    const ok = await isPassMatched(password, account.password);
    if (!ok) return responseStatus(res, 401, "failed", "Invalid credentials");
    const assignment = await prisma.userRoleAssignment.findFirst({
      where: { userAccountId: account.id },
      include: { role: true },
    });
    let name;
    if (account.profileType === "ADMIN") {
      const adminProfile = await prisma.admin.findUnique({
        where: { id: account.profileId },
      });
      name = adminProfile?.name;
    } else if (account.profileType === "TEACHER") {
      const t = await prisma.teacher.findUnique({ where: { id: account.profileId } });
      name = t?.name;
    } else if (account.profileType === "STUDENT") {
      const s = await prisma.student.findUnique({ where: { id: account.profileId } });
      name = s?.name;
    } else if (account.profileType === "PARENT") {
      const p = await prisma.parent.findUnique({ where: { id: account.profileId } });
      name = p?.name;
    }

    return responseStatus(res, 200, "success", {
      profileType: account.profileType,
      profileId: account.profileId,
      email: account.email,
      name,
      roleCode: assignment?.role?.code,
      // JWT must use profile id so legacy Admin middleware and attachActor work
      token: generateToken(account.profileId),
    });
  }

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (admin && (await isPassMatched(password, admin.password))) {
    return responseStatus(res, 200, "success", await loginProfile("ADMIN", admin));
  }

  const teacher = await prisma.teacher.findUnique({ where: { email } });
  if (teacher && !teacher.isWithdrawn && (await isPassMatched(password, teacher.password))) {
    return responseStatus(res, 200, "success", await loginProfile("TEACHER", teacher));
  }

  const student = await prisma.student.findUnique({ where: { email } });
  if (
    student &&
    !student.isWithdrawn &&
    (await isPassMatched(password, student.password))
  ) {
    return responseStatus(res, 200, "success", await loginProfile("STUDENT", student));
  }

  const parent = await prisma.parent.findUnique({ where: { email } });
  if (parent && (await isPassMatched(password, parent.password))) {
    return responseStatus(res, 200, "success", await loginProfile("PARENT", parent));
  }

  return responseStatus(res, 401, "failed", "Invalid credentials");
};

exports.ssoStatusService = () => {
  const googleOn =
    !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
  return {
  google: {
    enabled: googleOn,
    authorizeUrl: googleOn ? "/api/v1/auth/google/start" : null,
  },
  microsoft: {
    enabled:
      !!process.env.MICROSOFT_CLIENT_ID && !!process.env.MICROSOFT_CLIENT_SECRET,
    authorizeUrl:
      process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET
        ? "/api/v1/auth/microsoft/start"
        : null,
  },
};
};

exports.ssoNotConfiguredService = (provider, res) =>
  responseStatus(
    res,
    501,
    "failed",
    `${provider} SSO is not configured. Set client ID/secret in environment.`
  );

/** Resolve login payload by email (SSO — no password). */
exports.loginByEmailService = async (email, res) => {
  if (!email) return responseStatus(res, 400, "failed", "email required");

  const account = await prisma.userAccount.findUnique({ where: { email } });
  if (account) {
    const assignment = await prisma.userRoleAssignment.findFirst({
      where: { userAccountId: account.id },
      include: { role: true },
    });
    let name;
    if (account.profileType === "ADMIN") {
      name = (await prisma.admin.findUnique({ where: { id: account.profileId } }))?.name;
    } else if (account.profileType === "TEACHER") {
      name = (await prisma.teacher.findUnique({ where: { id: account.profileId } }))?.name;
    } else if (account.profileType === "STUDENT") {
      name = (await prisma.student.findUnique({ where: { id: account.profileId } }))?.name;
    } else if (account.profileType === "PARENT") {
      name = (await prisma.parent.findUnique({ where: { id: account.profileId } }))?.name;
    }
    return responseStatus(res, 200, "success", {
      profileType: account.profileType,
      profileId: account.profileId,
      email: account.email,
      name,
      roleCode: assignment?.role?.code,
      token: generateToken(account.profileId),
    });
  }

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (admin) return responseStatus(res, 200, "success", await loginProfile("ADMIN", admin));

  const teacher = await prisma.teacher.findUnique({ where: { email } });
  if (teacher && !teacher.isWithdrawn) {
    return responseStatus(res, 200, "success", await loginProfile("TEACHER", teacher));
  }

  const student = await prisma.student.findUnique({ where: { email } });
  if (student && !student.isWithdrawn) {
    return responseStatus(res, 200, "success", await loginProfile("STUDENT", student));
  }

  const parent = await prisma.parent.findUnique({ where: { email } });
  if (parent) return responseStatus(res, 200, "success", await loginProfile("PARENT", parent));

  return responseStatus(
    res,
    404,
    "failed",
    "No SchoolPortal account for this Google email. Contact your school admin."
  );
};
