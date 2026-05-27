const express = require("express");
const ancillaryRouter = express.Router();
const protectedRoute = require("../../../middlewares/protectedRoute");
const validateBody = require("../../../middlewares/validateBody");
const { routeGpsSchema } = require("../../../lib/validation/access.schema");
const {
  listTransportRoutesController,
  createTransportRouteController,
  listCafeteriaMenusController,
  createCafeteriaMenuController,
  updateRouteGpsController,
} = require("../../../controllers/ancillary/ancillary.controller");

const readTransport = protectedRoute("ancillary.transport.read");
const manage = protectedRoute("ancillary.services.manage");

ancillaryRouter.get("/ancillary/transport-routes", [...readTransport], listTransportRoutesController);
ancillaryRouter.post("/ancillary/transport-routes", [...manage], createTransportRouteController);
ancillaryRouter.post(
  "/ancillary/transport-routes/:id/gps",
  [...manage],
  validateBody(routeGpsSchema),
  updateRouteGpsController
);
ancillaryRouter.get("/ancillary/cafeteria-menus", [...readTransport], listCafeteriaMenusController);
ancillaryRouter.post("/ancillary/cafeteria-menus", [...manage], createCafeteriaMenuController);

module.exports = ancillaryRouter;
