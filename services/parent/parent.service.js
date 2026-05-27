const prisma = require("../../lib/prisma");
const {
  hashPassword,
  isPassMatched,
} = require("../../handlers/passHash.handler");
const generateToken = require("../../utils/tokenGenerator");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");

exports.registerParentService = async (data, res) => {
  const { name, email, password, phone, campusId, studentIds, relationship } =
    data;

  const exists = await prisma.parent.findUnique({ where: { email } });
  if (exists) return responseStatus(res, 409, "failed", "Email already in use");

  const parent = await prisma.parent.create({
    data: {
      name,
      email,
      password: await hashPassword(password),
      phone,
      campusId,
      children: studentIds?.length
        ? {
            create: studentIds.map((studentId, i) => ({
              studentId,
              relationship: relationship || "Guardian",
              isPrimary: i === 0,
            })),
          }
        : undefined,
    },
    include: { children: { include: { student: true } } },
  });

  return responseStatus(res, 201, "success", serializeForApi(parent));
};

exports.parentLoginService = async (data, res) => {
  const { email, password } = data;
  const parent = await prisma.parent.findUnique({ where: { email } });
  if (!parent || !(await isPassMatched(password, parent.password))) {
    return responseStatus(res, 401, "failed", "Invalid credentials");
  }

  return responseStatus(res, 200, "success", {
    parent: serializeForApi(parent),
    token: generateToken(parent.id),
  });
};

exports.parentDashboardService = async (parentId, res) => {
  const parent = await prisma.parent.findUnique({
    where: { id: parentId },
    include: {
      children: {
        include: {
          student: {
            include: {
              gradeLevel: true,
              campus: true,
              results: {
                where: { isPublished: true },
                take: 5,
                orderBy: { createdAt: "desc" },
              },
            },
          },
        },
      },
    },
  });

  if (!parent) return responseStatus(res, 404, "failed", "Parent not found");

  const children = await Promise.all(
    parent.children.map(async (link) => {
      const studentId = link.student.id;
      const [fees, attendance] = await Promise.all([
        prisma.studentFee.findMany({
          where: {
            studentId,
            status: { in: ["PENDING", "OVERDUE"] },
          },
        }),
        prisma.attendanceRecord.findMany({
          where: { studentId },
          orderBy: { createdAt: "desc" },
          take: 60,
        }),
      ]);
      const outstandingFees = fees.reduce(
        (sum, f) => sum + Math.max(0, f.amountDue - f.amountPaid),
        0
      );
      const present = attendance.filter((a) => a.status === "PRESENT").length;
      const attendancePercent =
        attendance.length > 0 ? Math.round((present / attendance.length) * 100) : null;

      return {
        relationship: link.relationship,
        isPrimary: link.isPrimary,
        student: serializeForApi(link.student),
        gradeLevel: serializeForApi(link.student.gradeLevel),
        recentResults: link.student.results.map((r) => serializeForApi(r)),
        outstandingFees,
        currency: "NGN",
        attendancePercent,
      };
    })
  );

  return responseStatus(res, 200, "success", {
    parent: serializeForApi(parent),
    children,
  });
};

exports.linkChildService = async (parentId, studentId, relationship, res) => {
  const link = await prisma.parentStudent.upsert({
    where: {
      parentId_studentId: { parentId, studentId },
    },
    create: { parentId, studentId, relationship: relationship || "Guardian" },
    update: { relationship: relationship || "Guardian" },
  });
  return responseStatus(res, 200, "success", serializeForApi(link));
};
