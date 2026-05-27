const express = require("express");
const hrRouter = express.Router();
const protectedRoute = require("../../../middlewares/protectedRoute");
const validateBody = require("../../../middlewares/validateBody");
const { leaveRequestSchema, reviewLeaveSchema } = require("../../../lib/validation/leaveRequest.schema");
const {
  payrollRunSchema,
  payrollLineSchema,
  approvePayrollSchema,
} = require("../../../lib/validation/payroll.schema");
const {
  performanceReviewSchema,
  updatePerformanceSchema,
} = require("../../../lib/validation/performance.schema");
const {
  createLeaveRequestController,
  listLeaveRequestsController,
  reviewLeaveRequestController,
  createPayrollRunController,
  listPayrollRunsController,
  addPayrollLineController,
  approvePayrollRunController,
  listPerformanceReviewsController,
  createPerformanceReviewController,
  updatePerformanceReviewController,
} = require("../../../controllers/hr/hr.controller");

const manage = protectedRoute("hr.staff.manage");

hrRouter.post("/hr/leave-requests", [...manage], validateBody(leaveRequestSchema), createLeaveRequestController);
hrRouter.get("/hr/leave-requests", [...manage], listLeaveRequestsController);
hrRouter.patch("/hr/leave-requests/:id", [...manage], validateBody(reviewLeaveSchema), reviewLeaveRequestController);
hrRouter.post("/hr/payroll-runs", [...manage], validateBody(payrollRunSchema), createPayrollRunController);
hrRouter.get("/hr/payroll-runs", [...manage], listPayrollRunsController);
hrRouter.post("/hr/payroll-runs/:runId/lines", [...manage], validateBody(payrollLineSchema), addPayrollLineController);
hrRouter.patch("/hr/payroll-runs/:runId", [...manage], validateBody(approvePayrollSchema), approvePayrollRunController);
hrRouter.get("/hr/performance-reviews", [...manage], listPerformanceReviewsController);
hrRouter.post(
  "/hr/performance-reviews",
  [...manage],
  validateBody(performanceReviewSchema),
  createPerformanceReviewController
);
hrRouter.patch(
  "/hr/performance-reviews/:id",
  [...manage],
  validateBody(updatePerformanceSchema),
  updatePerformanceReviewController
);

module.exports = hrRouter;
