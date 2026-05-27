const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");

exports.createAcademicTermService = async (data, userId, res) => {
  const { name, description, duration } = data;

  const academicTerm = await prisma.academicTerm.findUnique({ where: { name } });
  if (academicTerm) {
    return responseStatus(res, 402, "failed", "Academic term already exists");
  }

  const academicTermCreated = await prisma.academicTerm.create({
    data: {
      name,
      description,
      duration,
      createdById: userId,
      admins: { create: { adminId: userId } },
    },
  });

  return responseStatus(res, 200, "success", serializeForApi(academicTermCreated));
};

exports.getAcademicTermsService = async () => {
  const terms = await prisma.academicTerm.findMany();
  return terms.map((t) => serializeForApi(t));
};

exports.getAcademicTermService = async (id) => {
  const term = await prisma.academicTerm.findUnique({ where: { id } });
  return serializeForApi(term);
};

exports.updateAcademicTermService = async (data, academicId, userId, res) => {
  const { name, description, duration } = data;

  const existing = await prisma.academicTerm.findFirst({
    where: { name, NOT: { id: academicId } },
  });
  if (existing) {
    return responseStatus(res, 402, "failed", "Academic term already exists");
  }

  const academicTerm = await prisma.academicTerm.update({
    where: { id: academicId },
    data: { name, description, duration, createdById: userId },
  });

  return responseStatus(res, 201, "success", serializeForApi(academicTerm));
};

exports.deleteAcademicTermService = async (id) => {
  const deleted = await prisma.academicTerm.delete({ where: { id } });
  return serializeForApi(deleted);
};
