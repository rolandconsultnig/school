const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");

exports.listFeeStructuresService = async (query, res) => {
  const { campusId, tier } = query;
  const rows = await prisma.feeStructure.findMany({
    where: {
      isActive: true,
      ...(campusId && { campusId }),
      ...(tier && { tier }),
    },
    orderBy: { name: "asc" },
  });
  return responseStatus(res, 200, "success", rows.map(serializeForApi));
};

exports.createFeeStructureService = async (data, res) => {
  const row = await prisma.feeStructure.create({ data });
  return responseStatus(res, 201, "success", serializeForApi(row));
};

exports.assignStudentFeeService = async (data, res) => {
  const { studentId, feeStructureId, dueDate } = data;
  const fee = await prisma.feeStructure.findUnique({
    where: { id: feeStructureId },
  });
  if (!fee) return responseStatus(res, 404, "failed", "Fee structure not found");

  const row = await prisma.studentFee.create({
    data: {
      studentId,
      feeStructureId,
      amountDue: fee.amount,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });
  return responseStatus(res, 201, "success", serializeForApi(row));
};

exports.listStudentFeesService = async (query, res) => {
  const { studentId, status } = query;
  const rows = await prisma.studentFee.findMany({
    where: {
      ...(studentId && { studentId }),
      ...(status && { status }),
    },
    include: { feeStructure: true, student: true },
    orderBy: { createdAt: "desc" },
  });
  return responseStatus(
    res,
    200,
    "success",
    rows.map((r) => ({
      ...serializeForApi(r),
      feeName: r.feeStructure.name,
      studentName: r.student.name,
    }))
  );
};

exports.applyPaymentToFee = async (feeId, amount) => {
  const fee = await prisma.studentFee.findUnique({ where: { id: feeId } });
  if (!fee) return null;

  const paid = fee.amountPaid + amount;
  let status = "PARTIAL";
  if (paid >= fee.amountDue) status = "PAID";
  else if (paid === 0) status = "PENDING";

  return prisma.studentFee.update({
    where: { id: feeId },
    data: { amountPaid: paid, status },
  });
};

exports.recordPaymentService = async (feeId, amount, res) => {
  const updated = await exports.applyPaymentToFee(feeId, amount);
  if (!updated) return responseStatus(res, 404, "failed", "Fee record not found");
  return responseStatus(res, 200, "success", serializeForApi(updated));
};

exports.exportLedgerCsvService = async (query, res) => {
  const { campusId, from, to } = query;
  const payments = await prisma.feePayment.findMany({
    where: {
      ...(from || to
        ? {
            createdAt: {
              ...(from && { gte: new Date(from) }),
              ...(to && { lte: new Date(to) }),
            },
          }
        : {}),
      studentFee: {
        ...(campusId
          ? { student: { campusId } }
          : {}),
      },
    },
    include: {
      studentFee: {
        include: { student: true, feeStructure: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const header =
    "date,student,fee,amount,provider,reference,status\n";
  const lines = payments.map((p) => {
    const d = p.createdAt.toISOString().slice(0, 10);
    const student = (p.studentFee?.student?.name || "").replace(/,/g, " ");
    const fee = (p.studentFee?.feeStructure?.name || "").replace(/,/g, " ");
    return `${d},${student},${fee},${p.amount},${p.provider},${p.reference || ""},${p.status}`;
  });
  const csv = header + lines.join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="fee-ledger.csv"');
  return res.status(200).send(csv);
};

exports.listDefaultersService = async (res) => {
  const rows = await prisma.studentFee.findMany({
    where: { status: { in: ["PENDING", "OVERDUE", "PARTIAL"] } },
    include: { student: true, feeStructure: true },
    orderBy: { dueDate: "asc" },
  });
  return responseStatus(
    res,
    200,
    "success",
    rows.map((r) => ({
      ...serializeForApi(r),
      studentName: r.student.name,
      feeName: r.feeStructure.name,
      balance: r.amountDue - r.amountPaid,
    }))
  );
};
