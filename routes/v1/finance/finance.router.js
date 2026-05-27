const express = require("express");
const financeRouter = express.Router();
const protectedRoute = require("../../../middlewares/protectedRoute");
const validateBody = require("../../../middlewares/validateBody");
const {
  feeStructureSchema,
  assignStudentFeeSchema,
  recordPaymentSchema,
} = require("../../../lib/validation/finance.schema");
const {
  listFeeStructuresController,
  createFeeStructureController,
  assignStudentFeeController,
  listStudentFeesController,
  recordPaymentController,
  listDefaultersController,
  exportLedgerController,
} = require("../../../controllers/finance/finance.controller");
const {
  paymentStatusController,
  initializePaystackController,
  verifyPaystackController,
} = require("../../../controllers/finance/payment.controller");

const manage = protectedRoute("finance.fee.manage");

financeRouter.get("/finance/fee-structures", [...manage], listFeeStructuresController);
financeRouter.post(
  "/finance/fee-structures",
  [...manage],
  validateBody(feeStructureSchema),
  createFeeStructureController
);
financeRouter.post(
  "/finance/student-fees",
  [...manage],
  validateBody(assignStudentFeeSchema),
  assignStudentFeeController
);
financeRouter.get("/finance/student-fees", [...manage], listStudentFeesController);
financeRouter.post(
  "/finance/student-fees/:feeId/payments",
  [...manage],
  validateBody(recordPaymentSchema),
  recordPaymentController
);
financeRouter.get("/finance/defaulters", [...manage], listDefaultersController);
financeRouter.get("/finance/ledger/export", [...manage], exportLedgerController);

financeRouter.get("/finance/payments/status", paymentStatusController);
financeRouter.get("/finance/payments/paystack/verify/:reference", verifyPaystackController);
financeRouter.post(
  "/finance/student-fees/:feeId/payments/paystack/initialize",
  [...manage],
  initializePaystackController
);

module.exports = financeRouter;
