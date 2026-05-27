const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");

exports.getCourseGradebookService = async (courseId, res) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      subject: true,
      classLevel: true,
      enrollments: { include: { student: true } },
      assignments: {
        include: { submissions: true },
      },
    },
  });
  if (!course) return responseStatus(res, 404, "failed", "Course not found");

  const studentIds = course.enrollments.map((e) => e.studentId);

  const examResults = await prisma.examResult.findMany({
    where: {
      studentId: { in: studentIds },
      subjectId: course.subjectId,
      ...(course.classLevelId && { classLevelId: course.classLevelId }),
      isPublished: true,
    },
  });

  const examByStudent = {};
  for (const r of examResults) {
    if (!examByStudent[r.studentId]) examByStudent[r.studentId] = [];
    examByStudent[r.studentId].push(r.score);
  }

  const rows = course.enrollments.map((enrollment) => {
    const studentId = enrollment.studentId;
    const examScores = examByStudent[studentId] || [];
    const examAvg = examScores.length
      ? examScores.reduce((a, b) => a + b, 0) / examScores.length
      : null;

    const assignmentGrades = course.assignments.map((a) => {
      const sub = a.submissions.find((s) => s.studentId === studentId);
      return {
        assignmentId: a.id,
        title: a.title,
        maxScore: a.maxScore,
        score: sub?.score ?? null,
        status: sub?.status ?? null,
      };
    });

    const graded = assignmentGrades.filter((g) => g.score != null);
    const assignmentAvg = graded.length
      ? graded.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) /
        graded.length
      : null;

    const components = [examAvg, assignmentAvg].filter((v) => v != null);
    const overall =
      components.length > 0
        ? components.reduce((a, b) => a + b, 0) / components.length
        : null;

    return {
      student: serializeForApi(enrollment.student),
      examAverage: examAvg,
      assignmentAverage: assignmentAvg,
      overallPercent: overall,
      assignments: assignmentGrades,
      examCount: examScores.length,
    };
  });

  return responseStatus(res, 200, "success", {
    course: serializeForApi(course),
    subject: serializeForApi(course.subject),
    classLevel: serializeForApi(course.classLevel),
    students: rows,
  });
};

exports.getStudentGradebookService = async (studentId, res) => {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { studentId, course: { isPublished: true } },
    include: {
      course: {
        include: {
          subject: true,
          assignments: {
            where: { isPublished: true },
            include: {
              submissions: { where: { studentId } },
            },
          },
        },
      },
    },
  });

  const examResults = await prisma.examResult.findMany({
    where: { studentId, isPublished: true },
    include: { exam: true, subject: true },
  });

  const courses = enrollments.map((e) => {
    const c = e.course;
    const assignments = c.assignments.map((a) => {
      const sub = a.submissions[0];
      return {
        title: a.title,
        maxScore: a.maxScore,
        score: sub?.score ?? null,
        status: sub?.status ?? null,
      };
    });

    const subjectExams = examResults.filter(
      (r) => r.subjectId === c.subjectId
    );
    const examAvg = subjectExams.length
      ? subjectExams.reduce((s, r) => s + r.score, 0) / subjectExams.length
      : null;

    return {
      courseId: c.id,
      title: c.title,
      subject: serializeForApi(c.subject),
      assignments,
      examAverage: examAvg,
    };
  });

  return responseStatus(res, 200, "success", {
    studentId,
    courses,
    exams: examResults.map((r) => serializeForApi(r)),
  });
};
