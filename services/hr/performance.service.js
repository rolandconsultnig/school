const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");

exports.listPerformanceReviewsService = async (query, res) => {
  const rows = await prisma.performanceReview.findMany({
    where: {
      ...(query.teacherId && { teacherId: query.teacherId }),
    },
    include: { teacher: true },
    orderBy: { createdAt: "desc" },
    take: 50,
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

exports.createPerformanceReviewService = async (data, res) => {
  const row = await prisma.performanceReview.create({
    data: {
      teacherId: data.teacherId,
      periodLabel: data.periodLabel,
      rating: data.rating != null ? Number(data.rating) : null,
      comments: data.comments,
      status: "DRAFT",
      reviewedById: data.reviewedById,
    },
    include: { teacher: true },
  });
  return responseStatus(res, 201, "success", {
    ...serializeForApi(row),
    teacherName: row.teacher.name,
  });
};

exports.updatePerformanceReviewService = async (id, data, res) => {
  const row = await prisma.performanceReview.update({
    where: { id },
    data: {
      ...(data.rating != null && { rating: Number(data.rating) }),
      ...(data.comments !== undefined && { comments: data.comments }),
      ...(data.status && { status: data.status }),
    },
    include: { teacher: true },
  });
  return responseStatus(res, 200, "success", {
    ...serializeForApi(row),
    teacherName: row.teacher.name,
  });
};
