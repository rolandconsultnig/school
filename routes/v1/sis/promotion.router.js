const express = require("express");
const promotionRouter = express.Router();
const protectedRoute = require("../../../middlewares/protectedRoute");
const {
  massAssignClassController,
  runPromotionController,
  getPromotionHistoryController,
} = require("../../../controllers/sis/promotion.controller");

const allocateClass = protectedRoute("sis.class.allocate");
const runPromotion = protectedRoute("sis.promotion.execute");
const readStudent = protectedRoute("sis.student.read");

promotionRouter.post(
  "/sis/classes/assign",
  [...allocateClass],
  massAssignClassController
);

promotionRouter.post(
  "/sis/promotions/run",
  [...runPromotion],
  runPromotionController
);

promotionRouter.get(
  "/sis/students/:studentId/promotions",
  [...readStudent],
  getPromotionHistoryController
);

module.exports = promotionRouter;
