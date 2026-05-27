const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");

async function isCampusLocked(campusId) {
  if (!campusId) {
    const any = await prisma.campus.findFirst({ where: { accessLockdown: true } });
    return !!any;
  }
  const campus = await prisma.campus.findUnique({ where: { id: campusId } });
  return !!campus?.accessLockdown;
}

exports.getAccessStatusService = async (campusId, res) => {
  const campus = campusId
    ? await prisma.campus.findUnique({ where: { id: campusId } })
    : null;
  return responseStatus(res, 200, "success", {
    accessLockdown: campus?.accessLockdown ?? false,
    campusId: campus?.id ?? null,
  });
};

exports.setLockdownService = async (campusId, enabled, res) => {
  if (!campusId) return responseStatus(res, 400, "failed", "campusId required");
  const campus = await prisma.campus.update({
    where: { id: campusId },
    data: { accessLockdown: !!enabled },
  });
  return responseStatus(res, 200, "success", serializeForApi(campus));
};

exports.listRulesService = async (res) => {
  const rows = await prisma.accessRule.findMany({
    orderBy: { name: "asc" },
  });
  return responseStatus(res, 200, "success", rows.map(serializeForApi));
};

exports.createRuleService = async (data, res) => {
  const row = await prisma.accessRule.create({ data });
  return responseStatus(res, 201, "success", serializeForApi(row));
};

exports.recordScanService = async (data, res) => {
  const { gate, externalId, studentId, ruleId, campusId } = data;

  if (await isCampusLocked(campusId)) {
    const scan = await prisma.accessScan.create({
      data: {
        gate: gate || "main",
        externalId,
        studentId: null,
        ruleId,
        granted: false,
      },
    });
    return responseStatus(res, 201, "success", {
      ...serializeForApi(scan),
      deniedReason: "Campus lockdown active",
    });
  }

  let resolvedStudentId = studentId;
  if (!resolvedStudentId && externalId) {
    const student = await prisma.student.findFirst({
      where: { OR: [{ studentId: externalId }, { id: externalId }] },
    });
    if (student) resolvedStudentId = student.id;
  }

  const scan = await prisma.accessScan.create({
    data: {
      gate: gate || "main",
      externalId,
      studentId: resolvedStudentId,
      ruleId,
      granted: !!resolvedStudentId,
    },
  });
  return responseStatus(res, 201, "success", serializeForApi(scan));
};

exports.webhookScanService = async (data, apiKey, res) => {
  const expected = process.env.IOT_WEBHOOK_SECRET;
  if (expected && apiKey !== expected) {
    return responseStatus(res, 401, "failed", "Invalid webhook key");
  }
  return exports.recordScanService(data, res);
};

exports.listScansService = async (query, res) => {
  const limit = Math.min(Number(query.limit) || 50, 200);
  const rows = await prisma.accessScan.findMany({
    take: limit,
    orderBy: { scannedAt: "desc" },
    include: { student: true },
  });
  return responseStatus(
    res,
    200,
    "success",
    rows.map((r) => ({
      ...serializeForApi(r),
      studentName: r.student?.name,
    }))
  );
};
