const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");

async function assertEnrolled(courseId, studentId) {
  return prisma.courseEnrollment.findUnique({
    where: { courseId_studentId: { courseId, studentId } },
  });
}

exports.createAssignmentService = async (courseId, data, res) => {
  const { title, description, type, maxScore, dueAt, isPublished } = data;
  if (!title) return responseStatus(res, 400, "failed", "title is required");

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return responseStatus(res, 404, "failed", "Course not found");

  const assignment = await prisma.assignment.create({
    data: {
      courseId,
      title,
      description,
      type: type || "HOMEWORK",
      maxScore: maxScore ?? 100,
      dueAt: dueAt ? new Date(dueAt) : null,
      isPublished: !!isPublished,
    },
  });

  return responseStatus(res, 201, "success", serializeForApi(assignment));
};

exports.listAssignmentsService = async (courseId, query, res) => {
  const { publishedOnly } = query;
  const assignments = await prisma.assignment.findMany({
    where: {
      courseId,
      ...(publishedOnly === "true" && { isPublished: true }),
    },
    include: { _count: { select: { submissions: true } } },
    orderBy: { dueAt: "asc" },
  });
  return responseStatus(
    res,
    200,
    "success",
    assignments.map((a) => serializeForApi(a))
  );
};

exports.updateAssignmentService = async (assignmentId, data, res) => {
  const assignment = await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.type && { type: data.type }),
      ...(data.maxScore != null && { maxScore: data.maxScore }),
      ...(data.dueAt !== undefined && {
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
      }),
      ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
    },
  });
  return responseStatus(res, 200, "success", serializeForApi(assignment));
};

exports.submitAssignmentService = async (assignmentId, studentId, data, res) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { course: true },
  });
  if (!assignment || !assignment.isPublished) {
    return responseStatus(res, 404, "failed", "Assignment not found or not published");
  }

  const enrolled = await assertEnrolled(assignment.courseId, studentId);
  if (!enrolled) {
    return responseStatus(res, 403, "failed", "Not enrolled in this course");
  }

  const now = new Date();
  const isLate =
    assignment.dueAt && now > assignment.dueAt ? "LATE" : "SUBMITTED";

  const submission = await prisma.assignmentSubmission.upsert({
    where: {
      assignmentId_studentId: { assignmentId, studentId },
    },
    create: {
      assignmentId,
      studentId,
      contentUrl: data.contentUrl,
      contentText: data.contentText,
      status: isLate,
      submittedAt: now,
    },
    update: {
      contentUrl: data.contentUrl,
      contentText: data.contentText,
      status: isLate,
      submittedAt: now,
    },
  });

  return responseStatus(res, 200, "success", serializeForApi(submission));
};

exports.gradeSubmissionService = async (
  submissionId,
  data,
  gradedById,
  res
) => {
  const { score, feedback } = data;
  if (score == null) return responseStatus(res, 400, "failed", "score is required");

  const submission = await prisma.assignmentSubmission.update({
    where: { id: submissionId },
    data: {
      score,
      feedback,
      status: "GRADED",
      gradedAt: new Date(),
      gradedById,
    },
    include: { student: true, assignment: true },
  });

  return responseStatus(res, 200, "success", serializeForApi(submission));
};

exports.listSubmissionsService = async (assignmentId, res) => {
  const subs = await prisma.assignmentSubmission.findMany({
    where: { assignmentId },
    include: { student: true },
    orderBy: { submittedAt: "desc" },
  });
  return responseStatus(
    res,
    200,
    "success",
    subs.map((s) => ({
      ...serializeForApi(s),
      studentName: s.student.name,
    }))
  );
};
