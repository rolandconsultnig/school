const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");

exports.listTransportRoutesService = async (campusId, res) => {
  const rows = await prisma.transportRoute.findMany({
    where: campusId ? { campusId } : {},
    orderBy: { name: "asc" },
  });
  return responseStatus(res, 200, "success", rows.map(serializeForApi));
};

exports.createTransportRouteService = async (data, res) => {
  const row = await prisma.transportRoute.create({ data });
  return responseStatus(res, 201, "success", serializeForApi(row));
};

exports.listCafeteriaMenusService = async (query, res) => {
  const { campusId, from, to } = query;
  const rows = await prisma.cafeteriaMenu.findMany({
    where: {
      ...(campusId && { campusId }),
      ...(from || to
        ? {
            menuDate: {
              ...(from && { gte: new Date(from) }),
              ...(to && { lte: new Date(to) }),
            },
          }
        : {}),
    },
    orderBy: { menuDate: "desc" },
  });
  return responseStatus(res, 200, "success", rows.map(serializeForApi));
};

exports.createCafeteriaMenuService = async (data, res) => {
  const row = await prisma.cafeteriaMenu.create({
    data: {
      campusId: data.campusId,
      menuDate: new Date(data.menuDate),
      mealType: data.mealType,
      items: data.items,
    },
  });
  return responseStatus(res, 201, "success", serializeForApi(row));
};

exports.updateRouteGpsService = async (routeId, data, res) => {
  const row = await prisma.transportRoute.update({
    where: { id: routeId },
    data: {
      lastLatitude: Number(data.latitude),
      lastLongitude: Number(data.longitude),
      lastGpsAt: new Date(),
    },
  });
  return responseStatus(res, 200, "success", serializeForApi(row));
};
