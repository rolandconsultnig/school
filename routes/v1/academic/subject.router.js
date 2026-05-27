const express = require("express");
const subjectRouter = express.Router();
// middlewares
const protectedRoute = require("../../../middlewares/protectedRoute");
// controllers
const {
  getSubjectsController,
  getSubjectController,
  updateSubjectController,
  deleteSubjectController,
  createSubjectController,
} = require("../../../controllers/academic/subject.controller");

const lmsManage = protectedRoute("lms.course.manage");
const lmsWrite = protectedRoute("lms.exam.manage");

subjectRouter.route("/subject").get([...lmsManage], getSubjectsController);
subjectRouter
  .route("/subject/:id")
  .get([...lmsManage], getSubjectController)
  .patch([...lmsWrite], updateSubjectController)
  .delete([...lmsWrite], deleteSubjectController);
subjectRouter
  .route("/create-subject/:programId")
  .post([...lmsWrite], createSubjectController);

module.exports = subjectRouter;
