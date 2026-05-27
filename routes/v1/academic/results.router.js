const express = require("express");
const resultsRouter = express.Router();
// middleware
const isLoggedIn = require("../../../middlewares/isLoggedIn");
const isStudent = require("../../../middlewares/isStudent");
const protectedRoute = require("../../../middlewares/protectedRoute");
const readGrades = protectedRoute("lms.grade.read");
// controllers
const {
  studentCheckExamResultController,
  getAllExamResultsController,
} = require("../../../controllers/academic/results.controller");
// student check exam result
resultsRouter
  .route("/exam-result/:examId/check")
  .post(isLoggedIn, isStudent, studentCheckExamResultController);
//   Teacher get all exam result
resultsRouter
  .route("/exam-results/:classLevelId")
  .get([...readGrades], getAllExamResultsController);

module.exports = resultsRouter;
