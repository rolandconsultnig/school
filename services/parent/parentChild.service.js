const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");

async function assertParentChild(parentId, studentId) {
  const link = await prisma.parentStudent.findUnique({
    where: { parentId_studentId: { parentId, studentId } },
  });
  return !!link;
}

exports.getChildSummaryService = async (parentId, studentId, res) => {
  const allowed = await assertParentChild(parentId, studentId);
  if (!allowed) return responseStatus(res, 403, "failed", "Child not linked to this parent");

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { gradeLevel: true, campus: true },
  });
  if (!student) return responseStatus(res, 404, "failed", "Student not found");

  const [fees, attendance, results, reportCards] = await Promise.all([
    prisma.studentFee.findMany({
      where: { studentId },
      include: { feeStructure: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.attendanceRecord.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      take: 90,
    }),
    prisma.examResult.findMany({
      where: { studentId, isPublished: true },
      include: { exam: true, subject: true },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.reportCard.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const outstanding = fees
    .filter((f) => ["PENDING", "OVERDUE"].includes(f.status))
    .reduce((s, f) => s + Math.max(0, f.amountDue - f.amountPaid), 0);
  const present = attendance.filter((a) => a.status === "PRESENT").length;
  const attendancePercent =
    attendance.length > 0 ? Math.round((present / attendance.length) * 100) : null;

  return responseStatus(res, 200, "success", {
    student: serializeForApi(student),
    gradeLevel: serializeForApi(student.gradeLevel),
    outstandingFees: outstanding,
    currency: "NGN",
    attendancePercent,
    fees: fees.map((f) => ({
      ...serializeForApi(f),
      feeName: f.feeStructure.name,
    })),
    results: results.map((r) => ({
      ...serializeForApi(r),
      examName: r.exam?.name,
      subjectName: r.subject?.name,
    })),
    reportCards: reportCards.map((c) => ({
      id: c.id,
      isPublished: c.isPublished,
      createdAt: c.createdAt,
    })),
  });
};
