const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");

exports.createExamService = async (data, teacherId, res) => {
  const {
    name,
    description,
    subject,
    program,
    passMark,
    totalMark,
    academicTerm,
    duration,
    examDate,
    examTime,
    classLevel,
    academicYear,
  } = data;

  const teacherExist = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacherExist)
    return responseStatus(res, 401, "failed", "Teacher not found!");

  const examExist = await prisma.exam.findFirst({ where: { name } });
  if (examExist)
    return responseStatus(res, 402, "failed", "Exam already exists");

  const examCreate = await prisma.exam.create({
    data: {
      name,
      description,
      subjectId: subject,
      programId: program,
      passMark: passMark ?? 50,
      totalMark: totalMark ?? 100,
      academicTermId: academicTerm,
      duration: duration ?? "30 minutes",
      examDate: examDate ? new Date(examDate) : new Date(),
      examTime,
      ...(classLevel && { classLevelId: classLevel }),
      ...(academicYear && { academicYearId: academicYear }),
      createdById: teacherExist.id,
      teachers: { create: { teacherId: teacherExist.id } },
    },
  });

  return responseStatus(res, 200, "success", serializeForApi(examCreate));
};

exports.getAllExamService = async (query = {}) => {
  const { tier, campusId } = query;
  const exams = await prisma.exam.findMany({
    where: {
      ...(tier && {
        OR: [{ classLevel: { tier } }, { classLevelId: null }],
      }),
      ...(campusId && {
        OR: [{ classLevel: { campusId } }, { classLevelId: null }],
      }),
    },
    include: {
      classLevel: true,
      _count: { select: { questions: true } },
    },
  });
  return exams.map((e) => ({
    ...serializeForApi(e),
    totalQuestions: e._count?.questions ?? 0,
  }));
};

exports.getExamByIdService = async (id) => {
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: { questions: { include: { question: true } } },
  });
  if (!exam) return null;
  const serialized = serializeForApi(exam);
  serialized.questions = exam.questions.map((eq) =>
    serializeForApi(eq.question)
  );
  return serialized;
};

exports.updateExamService = async (data, examId, res) => {
  const {
    name,
    description,
    subject,
    program,
    academicTerm,
    duration,
    examDate,
    examTime,
    examType,
    createdBy,
    academicYear,
    classLevel,
  } = data;

  const duplicate = await prisma.exam.findFirst({
    where: { name, NOT: { id: examId } },
  });
  if (duplicate) {
    return responseStatus(res, 402, "failed", "Exam already exists");
  }

  const examUpdated = await prisma.exam.update({
    where: { id: examId },
    data: {
      ...(name && { name }),
      ...(description && { description }),
      ...(subject && { subjectId: subject }),
      ...(program && { programId: program }),
      ...(academicTerm && { academicTermId: academicTerm }),
      ...(duration && { duration }),
      ...(examDate && { examDate: new Date(examDate) }),
      ...(examTime && { examTime }),
      ...(examType && { examType }),
      ...(createdBy && { createdById: createdBy }),
      ...(academicYear && { academicYearId: academicYear }),
      ...(classLevel && { classLevelId: classLevel }),
    },
  });

  return responseStatus(res, 200, "success", serializeForApi(examUpdated));
};
