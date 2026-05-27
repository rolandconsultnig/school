const express = require("express");
const questionsRouter = express.Router();
const protectedRoute = require("../../../middlewares/protectedRoute");
const manage = protectedRoute("lms.exam.manage");
const {
  createQuestionsController,
  getAllQuestionsController,
  getQuestionByIdController,
  updateQuestionController,
} = require("../../../controllers/academic/questions.controller");

questionsRouter.route("/question").get([...manage], getAllQuestionsController);
questionsRouter
  .route("/questions/:examId/create")
  .post([...manage], createQuestionsController);
questionsRouter
  .route("/question/:id")
  .get([...manage], getQuestionByIdController)
  .patch([...manage], updateQuestionController);

module.exports = questionsRouter;
