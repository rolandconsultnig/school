const {
  hashPassword,
  isPassMatched,
} = require("../../handlers/passHash.handler");
const prisma = require("../../lib/prisma");
const generateToken = require("../../utils/tokenGenerator");
const responseStatus = require("../../handlers/responseStatus.handler");
const { resultCalculate } = require("../../functions/resultCalculate.function");
const { serializeForApi } = require("../../utils/serialize");
const { generateStudentId } = require("../../utils/entityIds");
const { scopeFromBody, parseTier } = require("../../lib/tenant/parseScope");

exports.adminRegisterStudentService = async (data, adminId, res, tenant = {}) => {
  const { name, email, password, gradeLevelId, section } = data;
  const { campusId, tier } = scopeFromBody(data, tenant);

  if (data.tier && !parseTier(data.tier)) {
    return responseStatus(
      res,
      400,
      "failed",
      "Invalid tier. Use NURSERY, PRIMARY, or SECONDARY"
    );
  }

  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin) {
    return responseStatus(res, 405, "failed", "Unauthorized access!");
  }

  const student = await prisma.student.findUnique({ where: { email } });
  if (student)
    return responseStatus(res, 402, "failed", "Student already enrolled");

  const hashedPassword = await hashPassword(password);
  const studentRegistered = await prisma.student.create({
    data: {
      name,
      email,
      password: hashedPassword,
      studentId: generateStudentId(name),
      campusId,
      tier,
      gradeLevelId,
      section,
      admins: { create: { adminId: admin.id } },
    },
  });

  return responseStatus(res, 200, "success", serializeForApi(studentRegistered));
};

exports.studentLoginService = async (data, res) => {
  const { email, password } = data;
  const student = await prisma.student.findUnique({ where: { email } });
  if (!student)
    return responseStatus(res, 402, "failed", "Invalid login credentials");

  const isMatched = await isPassMatched(password, student.password);
  if (!isMatched)
    return responseStatus(res, 401, "failed", "Invalid login credentials");

  const responseData = {
    student: serializeForApi(student),
    token: generateToken(student.id),
  };
  return responseStatus(res, 200, "success", responseData);
};

exports.getStudentsProfileService = async (id, res) => {
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) return responseStatus(res, 402, "failed", "Student not found");
  return responseStatus(res, 200, "success", serializeForApi(student));
};

exports.getAllStudentsByAdminService = async (res) => {
  const result = await prisma.student.findMany();
  return responseStatus(
    res,
    200,
    "success",
    result.map((s) => serializeForApi(s))
  );
};

exports.getStudentByAdminService = async (studentID, res) => {
  const student = await prisma.student.findUnique({ where: { id: studentID } });
  if (!student) return responseStatus(res, 402, "failed", "Student not found");
  return responseStatus(res, 200, "success", serializeForApi(student));
};

exports.studentUpdateProfileService = async (data, userId, res) => {
  const { email, password } = data;

  const emailExist = await prisma.student.findFirst({
    where: { email, NOT: { id: userId } },
  });
  if (emailExist)
    return responseStatus(res, 402, "failed", "This email is taken/exist");

  const updateData = password
    ? { email, password: await hashPassword(password) }
    : { email };

  const student = await prisma.student.update({
    where: { id: userId },
    data: updateData,
  });
  return responseStatus(res, 200, "success", serializeForApi(student));
};

exports.adminUpdateStudentService = async (data, studentId, res) => {
  const { classLevels, academicYear, program, name, email, prefectName } =
    data;

  const studentFound = await prisma.student.findUnique({
    where: { id: studentId },
  });
  if (!studentFound)
    return responseStatus(res, 402, "failed", "Student not found");

  const classLevelIds = Array.isArray(classLevels)
    ? classLevels
    : classLevels
      ? [classLevels]
      : [];

  if (classLevelIds.length) {
    await prisma.studentClassLevel.createMany({
      data: classLevelIds.map((classLevelId) => ({ studentId, classLevelId })),
      skipDuplicates: true,
    });
  }

  const studentUpdated = await prisma.student.update({
    where: { id: studentId },
    data: {
      ...(name && { name }),
      ...(email && { email }),
      ...(academicYear && { academicYearId: academicYear }),
      ...(program && { programId: program }),
      ...(prefectName && { prefectName }),
    },
  });

  return responseStatus(res, 200, "success", serializeForApi(studentUpdated));
};

exports.studentWriteExamService = async (data, studentId, examId, res) => {
  const { answers } = data;

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return responseStatus(res, 404, "failed", "Student not found");

  const findExam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { questions: { include: { question: true } } },
  });
  if (!findExam) return responseStatus(res, 404, "failed", "Exam not found");

  const alreadyExamTaken = await prisma.examResult.findFirst({
    where: { studentId: student.id, examId: findExam.id },
  });
  if (alreadyExamTaken)
    return responseStatus(res, 400, "failed", "Already written the exam!");

  if (student.isSuspended || student.isWithdrawn)
    return responseStatus(
      res,
      401,
      "failed",
      "You are eligible to attend this exam"
    );

  const questions = findExam.questions.map((eq) => eq.question);
  if (questions.length !== answers.length)
    return responseStatus(
      res,
      406,
      "failed",
      "You have not answered all the questions"
    );

  const result = await resultCalculate(questions, answers, findExam);

  const createResult = await prisma.examResult.create({
    data: {
      studentId: student.id,
      teacherId: findExam.createdById,
      examId: findExam.id,
      score: result.score,
      grade: result.grade,
      passMark: findExam.passMark,
      status: result.status,
      remarks: result.remarks,
      answeredQuestions: result.answeredQuestions,
      classLevelId: findExam.classLevelId,
      academicTermId: findExam.academicTermId,
      academicYearId: findExam.academicYearId,
      students: { create: { studentId: student.id } },
    },
  });

  return responseStatus(res, 200, "success", serializeForApi(createResult));
};
