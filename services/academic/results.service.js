const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");

exports.studentCheckExamResultService = async (examId, studentId, res) => {
  const result = await prisma.examResult.findFirst({
    where: { examId, studentId },
    include: {
      exam: {
        include: {
          questions: { include: { question: true } },
        },
      },
      classLevel: true,
      subject: true,
      academicTerm: true,
      academicYear: true,
    },
  });

  if (!result)
    return responseStatus(res, 404, "failed", "Result not found");

  if (!result.isPublished)
    return responseStatus(
      res,
      400,
      "failed",
      "Result is not published yet! Please wait for further notice"
    );

  const serialized = serializeForApi(result);
  if (result.exam) {
    serialized.exam = serializeForApi(result.exam);
    serialized.exam.questions = result.exam.questions.map((eq) =>
      serializeForApi(eq.question)
    );
  }
  serialized.classLevel = serializeForApi(result.classLevel);
  serialized.subject = serializeForApi(result.subject);
  serialized.academicTerm = serializeForApi(result.academicTerm);
  serialized.academicYear = serializeForApi(result.academicYear);

  return responseStatus(res, 200, "success", serialized);
};

exports.getAllExamResultsService = async (classId, teacherId, res) => {
  const results = await prisma.examResult.findMany({
    where: { classLevelId: classId, teacherId },
  });

  return responseStatus(
    res,
    200,
    "success",
    results.map((r) => serializeForApi(r))
  );
};

exports.adminPublishResultService = async (examId, res) => {
  const count = await prisma.examResult.count({ where: { examId } });
  if (!count) {
    return responseStatus(res, 404, "failed", "No results found for this exam");
  }

  const { count: updated } = await prisma.examResult.updateMany({
    where: { examId },
    data: { isPublished: true },
  });

  return responseStatus(res, 200, "success", {
    examId,
    publishedCount: updated,
  });
};

exports.adminUnpublishResultService = async (examId, res) => {
  const count = await prisma.examResult.count({ where: { examId } });
  if (!count) {
    return responseStatus(res, 404, "failed", "No results found for this exam");
  }

  const { count: updated } = await prisma.examResult.updateMany({
    where: { examId },
    data: { isPublished: false },
  });

  return responseStatus(res, 200, "success", {
    examId,
    unpublishedCount: updated,
  });
};
