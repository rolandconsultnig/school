const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");

exports.createYearGroupService = async (data, userId, res) => {
  const { name, academicYear } = data;

  const yearGroupFound = await prisma.yearGroup.findFirst({
    where: { name, academicYearId: academicYear },
  });
  if (yearGroupFound) {
    return responseStatus(res, 402, "failed", "Year Group already exists");
  }

  const yearGroupCreated = await prisma.yearGroup.create({
    data: {
      name,
      academicYearId: academicYear,
      createdById: userId,
      admins: { create: { adminId: userId } },
    },
  });

  return responseStatus(res, 200, "success", serializeForApi(yearGroupCreated));
};

exports.getAllYearGroupsService = async () => {
  const groups = await prisma.yearGroup.findMany();
  return groups.map((g) => serializeForApi(g));
};

exports.getYearGroupsService = async (id) => {
  const group = await prisma.yearGroup.findUnique({ where: { id } });
  return serializeForApi(group);
};

exports.updateYearGroupService = async (data, id, userId, res) => {
  const { name, academicYear } = data;

  const existing = await prisma.yearGroup.findFirst({
    where: {
      name,
      academicYearId: academicYear,
      NOT: { id },
    },
  });
  if (existing) {
    return responseStatus(res, 402, "failed", "Year Group already exists");
  }

  const yearGroup = await prisma.yearGroup.update({
    where: { id },
    data: { name, academicYearId: academicYear, createdById: userId },
  });

  return responseStatus(res, 200, "success", serializeForApi(yearGroup));
};

exports.deleteYearGroupService = async (id) => {
  const deleted = await prisma.yearGroup.delete({ where: { id } });
  return serializeForApi(deleted);
};
