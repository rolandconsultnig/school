const express = require("express");
const analyticsRouter = express.Router();
const protectedRoute = require("../../../middlewares/protectedRoute");
const {
  getExecutiveDashboardController,
  generateReportCardController,
  listReportCardsController,
  listRecentReportCardsController,
  reportCardHtmlController,
  bulkGenerateReportCardsController,
} = require("../../../controllers/analytics/analytics.controller");

const readDash = protectedRoute("analytics.dashboard.read");

analyticsRouter.get(
  "/analytics/executive-dashboard",
  [...readDash],
  getExecutiveDashboardController
);

analyticsRouter.post(
  "/analytics/students/:studentId/report-cards",
  [...readDash],
  generateReportCardController
);

analyticsRouter.get(
  "/analytics/students/:studentId/report-cards",
  [...readDash],
  listReportCardsController
);

analyticsRouter.get(
  "/analytics/report-cards",
  [...readDash],
  listRecentReportCardsController
);

analyticsRouter.get(
  "/analytics/report-cards/:reportCardId/html",
  [...readDash],
  reportCardHtmlController
);

analyticsRouter.post(
  "/analytics/report-cards/bulk-generate",
  [...readDash],
  bulkGenerateReportCardsController
);

module.exports = analyticsRouter;
