const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");
const { generateProgramCode } = require("../../utils/entityIds");

exports.createProgramService = async (data, userId, res) => {
  const { name, description } = data;

  const programFound = await prisma.program.findUnique({ where: { name } });
  if (programFound) {
    return responseStatus(res, 402, "failed", "Program already exists");
  }

  const programCreated = await prisma.program.create({
    data: {
      name,
      description,
      code: generateProgramCode(name),
      createdById: userId,
      admins: { create: { adminId: userId } },
    },
  });

  return responseStatus(res, 200, "success", serializeForApi(programCreated));
};

exports.getAllProgramsService = async () => {
  const programs = await prisma.program.findMany();
  return programs.map((p) => serializeForApi(p));
};

exports.getProgramsService = async (id) => {
  const program = await prisma.program.findUnique({ where: { id } });
  return serializeForApi(program);
};

exports.updateProgramService = async (data, id, userId, res) => {
  const { name, description } = data;

  const programFound = await prisma.program.findFirst({
    where: { name, NOT: { id } },
  });
  if (programFound) {
    return responseStatus(res, 402, "failed", "Program already exists");
  }

  const programs = await prisma.program.update({
    where: { id },
    data: { name, description, createdById: userId },
  });

  return responseStatus(res, 200, "success", serializeForApi(programs));
};

exports.deleteProgramService = async (id) => {
  const deleted = await prisma.program.delete({ where: { id } });
  return serializeForApi(deleted);
};
