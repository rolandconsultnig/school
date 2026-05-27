const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");

exports.createAcademicYearService = async (data, userId, res) => {
  const { name, fromYear, toYear } = data;

  const academicYear = await prisma.academicYear.findUnique({ where: { name } });
  if (academicYear) {
    return responseStatus(res, 402, "failed", "Academic year already exists");
  }

  const academicYearCreated = await prisma.academicYear.create({
    data: {
      name,
      fromYear: new Date(fromYear),
      toYear: new Date(toYear),
      createdById: userId,
      admins: { create: { adminId: userId } },
    },
  });

  return responseStatus(res, 201, "success", serializeForApi(academicYearCreated));
};

exports.getAcademicYearsService = async () => {
  const years = await prisma.academicYear.findMany();
  return years.map((y) => serializeForApi(y));
};

exports.getAcademicYearService = async (id) => {
  const year = await prisma.academicYear.findUnique({ where: { id } });
  return serializeForApi(year);
};

exports.updateAcademicYearService = async (data, academicId, userId, res) => {
  const { name, fromYear, toYear } = data;

  const existing = await prisma.academicYear.findFirst({
    where: { name, NOT: { id: academicId } },
  });
  if (existing) {
    return responseStatus(res, 402, "failed", "Academic year already exists");
  }

  const academicYear = await prisma.academicYear.update({
    where: { id: academicId },
    data: {
      name,
      fromYear: new Date(fromYear),
      toYear: new Date(toYear),
      createdById: userId,
    },
  });

  return responseStatus(res, 201, "success", serializeForApi(academicYear));
};

exports.deleteAcademicYearService = async (id) => {
  const deleted = await prisma.academicYear.delete({ where: { id } });
  return serializeForApi(deleted);
};
