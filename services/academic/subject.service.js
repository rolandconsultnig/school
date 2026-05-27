const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");

exports.createSubjectService = async (data, programId, userId, res) => {
  const { name, description, academicTerm } = data;

  const programFound = await prisma.program.findUnique({ where: { id: programId } });
  if (!programFound)
    return responseStatus(res, 402, "failed", "Program not found");

  const subjectFound = await prisma.subject.findUnique({ where: { name } });
  if (subjectFound) {
    return responseStatus(res, 402, "failed", "Subject already exists");
  }

  const subjectCreated = await prisma.subject.create({
    data: {
      name,
      description,
      academicTermId: academicTerm,
      createdById: userId,
      programs: { create: { programId } },
    },
  });

  return responseStatus(res, 200, "success", serializeForApi(subjectCreated));
};

exports.getAllSubjectsService = async () => {
  const subjects = await prisma.subject.findMany();
  return subjects.map((s) => serializeForApi(s));
};

exports.getSubjectsService = async (id) => {
  const subject = await prisma.subject.findUnique({ where: { id } });
  return serializeForApi(subject);
};

exports.updateSubjectService = async (data, id, userId, res) => {
  const { name, description, academicTerm } = data;

  const existing = await prisma.subject.findFirst({
    where: { name, NOT: { id } },
  });
  if (existing) {
    return responseStatus(res, 402, "failed", "Subject already exists");
  }

  const subject = await prisma.subject.update({
    where: { id },
    data: {
      name,
      description,
      academicTermId: academicTerm,
      createdById: userId,
    },
  });

  return responseStatus(res, 200, "success", serializeForApi(subject));
};

exports.deleteSubjectService = async (id) => {
  const deleted = await prisma.subject.delete({ where: { id } });
  return serializeForApi(deleted);
};
