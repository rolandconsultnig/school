const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");

exports.createLeaveRequestService = async (data, res) => {
  const { teacherId, startDate, endDate, reason } = data;
  const row = await prisma.leaveRequest.create({
    data: {
      teacherId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
    },
  });
  return responseStatus(res, 201, "success", serializeForApi(row));
};

exports.listLeaveRequestsService = async (query, res) => {
  const { teacherId, status } = query;
  const rows = await prisma.leaveRequest.findMany({
    where: {
      ...(teacherId && { teacherId }),
      ...(status && { status }),
    },
    include: { teacher: true },
    orderBy: { createdAt: "desc" },
  });
  return responseStatus(
    res,
    200,
    "success",
    rows.map((r) => ({
      ...serializeForApi(r),
      teacherName: r.teacher.name,
    }))
  );
};

exports.reviewLeaveRequestService = async (id, data, reviewerId, res) => {
  const { status, reviewNote } = data;
  if (!["APPROVED", "REJECTED", "CANCELLED"].includes(status)) {
    return responseStatus(res, 400, "failed", "Invalid status");
  }
  const row = await prisma.leaveRequest.update({
    where: { id },
    data: { status, reviewNote, reviewedById: reviewerId },
  });
  return responseStatus(res, 200, "success", serializeForApi(row));
};
