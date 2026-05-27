const express = require("express");
const parentRouter = express.Router();
const isLoggedIn = require("../../../middlewares/isLoggedIn");
const isParent = require("../../../middlewares/isParent");
const protectedRoute = require("../../../middlewares/protectedRoute");
const {
  registerParentController,
  parentLoginController,
  parentDashboardController,
  linkChildController,
  childSummaryController,
} = require("../../../controllers/parent/parent.controller");

const manageStudent = protectedRoute("sis.student.manage");
const parentAuth = [isLoggedIn, isParent];

parentRouter.post("/parents/register", registerParentController);
parentRouter.post("/parents/login", parentLoginController);
parentRouter.get("/parents/portal/dashboard", parentAuth, parentDashboardController);
parentRouter.get(
  "/parents/portal/children/:studentId",
  parentAuth,
  childSummaryController
);
parentRouter.post(
  "/parents/:parentId/children",
  [...manageStudent],
  linkChildController
);

module.exports = parentRouter;
