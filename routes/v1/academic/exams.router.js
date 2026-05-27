const express = require("express");
const examRouter = express.Router();
const protectedRoute = require("../../../middlewares/protectedRoute");
const validateBody = require("../../../middlewares/validateBody");
const { createExamSchema } = require("../../../lib/validation/exam.schema");
const manage = protectedRoute("lms.exam.manage");
const {
  createExamController,
  getAllExamController,
  getExamByIdController,
  updateExamController,
} = require("../../../controllers/academic/exams.controller");

examRouter
  .route("/exams")
  .get([...manage], getAllExamController)
  .post([...manage], validateBody(createExamSchema), createExamController);
examRouter
  .route("/exams/:examId")
  .get([...manage], getExamByIdController)
  .patch([...manage], updateExamController);

module.exports = examRouter;
