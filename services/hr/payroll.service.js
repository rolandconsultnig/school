const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");

exports.createPayrollRunService = async (data, res) => {
  const row = await prisma.payrollRun.create({
    data: {
      campusId: data.campusId,
      periodLabel: data.periodLabel,
      status: "DRAFT",
    },
  });
  return responseStatus(res, 201, "success", serializeForApi(row));
};

exports.listPayrollRunsService = async (query, res) => {
  const rows = await prisma.payrollRun.findMany({
    where: query.campusId ? { campusId: query.campusId } : {},
    include: { lines: { include: { teacher: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return responseStatus(
    res,
    200,
    "success",
    rows.map((r) => ({
      ...serializeForApi(r),
      lineCount: r.lines.length,
      totalNet: r.lines.reduce((s, l) => s + l.netPay, 0),
    }))
  );
};

exports.addPayrollLineService = async (runId, data, res) => {
  const run = await prisma.payrollRun.findUnique({ where: { id: runId } });
  if (!run) return responseStatus(res, 404, "failed", "Payroll run not found");
  if (run.status !== "DRAFT") {
    return responseStatus(res, 400, "failed", "Can only add lines to DRAFT runs");
  }
  const base = Number(data.baseSalary) || 0;
  const deductions = Number(data.deductions) || 0;
  const line = await prisma.payrollLine.create({
    data: {
      payrollRunId: runId,
      teacherId: data.teacherId,
      baseSalary: base,
      deductions,
      netPay: base - deductions,
    },
    include: { teacher: true },
  });
  return responseStatus(res, 201, "success", {
    ...serializeForApi(line),
    teacherName: line.teacher.name,
  });
};

exports.approvePayrollRunService = async (runId, status, res) => {
  if (!["APPROVED", "PAID"].includes(status)) {
    return responseStatus(res, 400, "failed", "status must be APPROVED or PAID");
  }
  const row = await prisma.payrollRun.update({
    where: { id: runId },
    data: { status },
  });
  return responseStatus(res, 200, "success", serializeForApi(row));
};
