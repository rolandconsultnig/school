const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");
const { getNextGradeLevel } = require("../../lib/nigeria/promotion");

exports.massAssignClassService = async (classLevelId, studentIds, res) => {
  const classLevel = await prisma.classLevel.findUnique({
    where: { id: classLevelId },
  });
  if (!classLevel) {
    return responseStatus(res, 404, "failed", "Class level not found");
  }

  const ids = Array.isArray(studentIds) ? studentIds : [studentIds];
  await prisma.studentClassLevel.createMany({
    data: ids.map((studentId) => ({ studentId, classLevelId })),
    skipDuplicates: true,
  });

  return responseStatus(res, 200, "success", {
    classLevelId,
    assigned: ids.length,
  });
};

exports.runPromotionService = async (data, adminId, res) => {
  const {
    tier,
    campusId,
    fromGradeLevelId,
    repeaterStudentIds = [],
    graduateFinalYear = true,
    academicYearId,
  } = data;

  const repeaterSet = new Set(repeaterStudentIds);

  const students = await prisma.student.findMany({
    where: {
      tier,
      ...(campusId && { campusId }),
      gradeLevelId: fromGradeLevelId,
      isGraduated: false,
      isWithdrawn: false,
    },
  });

  const results = { promoted: [], repeated: [], graduated: [] };

  for (const student of students) {
    if (repeaterSet.has(student.id)) {
      await prisma.promotionRecord.create({
        data: {
          studentId: student.id,
          fromGradeLevelId: student.gradeLevelId,
          toGradeLevelId: student.gradeLevelId,
          promoted: false,
          academicYearId,
          promotedById: adminId,
          notes: "Repeating grade",
        },
      });
      results.repeated.push(serializeForApi(student));
      continue;
    }

    const nextGrade = student.gradeLevelId
      ? await getNextGradeLevel(student.gradeLevelId)
      : null;

    if (!nextGrade) {
      if (graduateFinalYear) {
        await prisma.student.update({
          where: { id: student.id },
          data: { isGraduated: true, yearGraduated: new Date().getFullYear().toString() },
        });
        await prisma.promotionRecord.create({
          data: {
            studentId: student.id,
            fromGradeLevelId: student.gradeLevelId,
            promoted: true,
            academicYearId,
            promotedById: adminId,
            notes: "Graduated — final grade",
          },
        });
        results.graduated.push(serializeForApi(student));
      }
      continue;
    }

    await prisma.student.update({
      where: { id: student.id },
      data: { gradeLevelId: nextGrade.id },
    });

    await prisma.promotionRecord.create({
      data: {
        studentId: student.id,
        fromGradeLevelId: student.gradeLevelId,
        toGradeLevelId: nextGrade.id,
        promoted: true,
        academicYearId,
        promotedById: adminId,
      },
    });

    results.promoted.push({
      student: serializeForApi(student),
      toGrade: serializeForApi(nextGrade),
    });
  }

  return responseStatus(res, 200, "success", {
    total: students.length,
    ...results,
    counts: {
      promoted: results.promoted.length,
      repeated: results.repeated.length,
      graduated: results.graduated.length,
    },
  });
};

exports.getPromotionHistoryService = async (studentId, res) => {
  const records = await prisma.promotionRecord.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
  });
  return responseStatus(
    res,
    200,
    "success",
    records.map((r) => serializeForApi(r))
  );
};
