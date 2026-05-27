const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");

const courseInclude = {
  subject: true,
  classLevel: true,
  teacher: true,
  academicTerm: true,
  _count: { select: { enrollments: true, assignments: true } },
};

exports.createCourseService = async (data, res) => {
  const {
    title,
    description,
    subjectId,
    classLevelId,
    teacherId,
    campusId,
    tier,
    academicTermId,
    isPublished,
  } = data;

  if (!title || !subjectId || !teacherId || !academicTermId) {
    return responseStatus(
      res,
      400,
      "failed",
      "title, subjectId, teacherId, academicTermId are required"
    );
  }

  const course = await prisma.course.create({
    data: {
      title,
      description,
      subjectId,
      classLevelId,
      teacherId,
      campusId,
      tier,
      academicTermId,
      isPublished: !!isPublished,
    },
    include: courseInclude,
  });

  if (classLevelId) {
    const links = await prisma.studentClassLevel.findMany({
      where: { classLevelId },
    });
    if (links.length) {
      await prisma.courseEnrollment.createMany({
        data: links.map((l) => ({ courseId: course.id, studentId: l.studentId })),
        skipDuplicates: true,
      });
    }
  }

  return responseStatus(res, 201, "success", serializeForApi(course));
};

exports.listCoursesService = async (query, res) => {
  const { teacherId, classLevelId, campusId, tier, isPublished } = query;
  const courses = await prisma.course.findMany({
    where: {
      ...(teacherId && { teacherId }),
      ...(classLevelId && { classLevelId }),
      ...(campusId && { campusId }),
      ...(tier && { tier }),
      ...(isPublished != null && { isPublished: isPublished === "true" }),
    },
    include: courseInclude,
    orderBy: { createdAt: "desc" },
  });
  return responseStatus(
    res,
    200,
    "success",
    courses.map((c) => serializeForApi(c))
  );
};

exports.getCourseService = async (courseId, res) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      ...courseInclude,
      enrollments: { include: { student: true } },
      assignments: { orderBy: { dueAt: "asc" } },
      liveSessions: { orderBy: { scheduledAt: "asc" } },
    },
  });
  if (!course) return responseStatus(res, 404, "failed", "Course not found");
  const data = serializeForApi(course);
  data.enrollments = course.enrollments.map((e) => ({
    ...serializeForApi(e),
    student: serializeForApi(e.student),
  }));
  data.assignments = course.assignments.map((a) => serializeForApi(a));
  data.liveSessions = course.liveSessions.map((s) => serializeForApi(s));
  return responseStatus(res, 200, "success", data);
};

exports.updateCourseService = async (courseId, data, res) => {
  const course = await prisma.course.update({
    where: { id: courseId },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
      ...(data.classLevelId !== undefined && { classLevelId: data.classLevelId }),
    },
    include: courseInclude,
  });
  return responseStatus(res, 200, "success", serializeForApi(course));
};

exports.enrollStudentsService = async (courseId, studentIds, res) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return responseStatus(res, 404, "failed", "Course not found");

  const ids = Array.isArray(studentIds) ? studentIds : [studentIds];
  await prisma.courseEnrollment.createMany({
    data: ids.map((studentId) => ({ courseId, studentId })),
    skipDuplicates: true,
  });

  return responseStatus(res, 200, "success", { courseId, enrolled: ids.length });
};

exports.getStudentCourseService = async (courseId, studentId, res) => {
  const enrolled = await prisma.courseEnrollment.findUnique({
    where: { courseId_studentId: { courseId, studentId } },
  });
  if (!enrolled) {
    return responseStatus(res, 403, "failed", "Not enrolled in this course");
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId, isPublished: true },
    include: {
      ...courseInclude,
      assignments: {
        where: { isPublished: true },
        orderBy: { dueAt: "asc" },
        include: { submissions: { where: { studentId } } },
      },
      liveSessions: { orderBy: { scheduledAt: "asc" } },
    },
  });
  if (!course) return responseStatus(res, 404, "failed", "Course not found");

  const total = course.assignments.length;
  const done = course.assignments.filter((a) => a.submissions[0]?.submittedAt).length;
  const progressPercent = total ? Math.round((done / total) * 100) : 0;

  const data = serializeForApi(course);
  data.assignments = course.assignments.map((a) => ({
    ...serializeForApi(a),
    submission: a.submissions[0] ? serializeForApi(a.submissions[0]) : null,
  }));
  data.liveSessions = course.liveSessions.map((s) => serializeForApi(s));
  data.progressPercent = progressPercent;
  return responseStatus(res, 200, "success", data);
};

exports.listStudentCoursesService = async (studentId, res) => {
  const rows = await prisma.courseEnrollment.findMany({
    where: { studentId, course: { isPublished: true } },
    include: {
      course: {
        include: { subject: true, teacher: true, liveSessions: true },
      },
    },
  });
  const payload = await Promise.all(
    rows.map(async (r) => {
      const c = r.course;
      const total = await prisma.assignment.count({
        where: { courseId: c.id, isPublished: true },
      });
      const done = await prisma.assignmentSubmission.count({
        where: {
          studentId,
          submittedAt: { not: null },
          assignment: { courseId: c.id, isPublished: true },
        },
      });
      return {
        ...serializeForApi(c),
        teacherName: c.teacher?.name,
        progressPercent: total ? Math.round((done / total) * 100) : 0,
      };
    })
  );
  return responseStatus(res, 200, "success", payload);
};
