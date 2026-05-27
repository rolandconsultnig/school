const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");
const { scopeFromBody, parseTier } = require("../../lib/tenant/parseScope");

exports.createClassLevelService = async (data, userId, res, tenant = {}) => {
  const { name, description, gradeLevelId, section } = data;
  const { campusId, tier } = scopeFromBody(data, tenant);

  if (data.tier && !parseTier(data.tier)) {
    return responseStatus(
      res,
      400,
      "failed",
      "Invalid tier. Use NURSERY, PRIMARY, or SECONDARY"
    );
  }

  const classFound = await prisma.classLevel.findFirst({
    where: { name, campusId: campusId ?? null },
  });
  if (classFound) {
    return responseStatus(res, 400, "failed", "Class already exists");
  }

  const classCreated = await prisma.classLevel.create({
    data: {
      name,
      description,
      createdById: userId,
      campusId,
      tier,
      gradeLevelId,
      section,
      admins: { create: { adminId: userId } },
    },
  });

  return responseStatus(res, 200, "success", serializeForApi(classCreated));
};

exports.getAllClassesService = async () => {
  const classes = await prisma.classLevel.findMany();
  return classes.map((c) => serializeForApi(c));
};

exports.getClassLevelsService = async (id) => {
  const classLevel = await prisma.classLevel.findUnique({ where: { id } });
  return serializeForApi(classLevel);
};

exports.updateClassLevelService = async (data, id, userId, res, tenant = {}) => {
  const { name, description, gradeLevelId, section } = data;
  const { campusId, tier } = scopeFromBody(data, tenant);

  const classFound = await prisma.classLevel.findFirst({
    where: {
      name: name || undefined,
      campusId: campusId ?? null,
      NOT: { id },
    },
  });
  if (classFound && name) {
    return responseStatus(res, 400, "failed", "Class already exists");
  }

  const classLevel = await prisma.classLevel.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(campusId !== undefined && { campusId }),
      ...(tier && { tier }),
      ...(gradeLevelId && { gradeLevelId }),
      ...(section && { section }),
      createdById: userId,
    },
  });

  return responseStatus(res, 200, "success", serializeForApi(classLevel));
};

exports.deleteClassLevelService = async (id) => {
  const deleted = await prisma.classLevel.delete({ where: { id } });
  return serializeForApi(deleted);
};
