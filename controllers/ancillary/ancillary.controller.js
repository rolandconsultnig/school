const responseStatus = require("../../handlers/responseStatus.handler");
const {
  listTransportRoutesService,
  createTransportRouteService,
  listCafeteriaMenusService,
  createCafeteriaMenuService,
  updateRouteGpsService,
} = require("../../services/ancillary/ancillary.service");

exports.listTransportRoutesController = async (req, res) => {
  try {
    await listTransportRoutesService(req.query.campusId, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.createTransportRouteController = async (req, res) => {
  try {
    await createTransportRouteService(req.body, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listCafeteriaMenusController = async (req, res) => {
  try {
    await listCafeteriaMenusService(req.query, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.createCafeteriaMenuController = async (req, res) => {
  try {
    await createCafeteriaMenuService(req.body, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.updateRouteGpsController = async (req, res) => {
  try {
    await updateRouteGpsService(req.params.id, req.body, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};
