const express = require("express");
const academicTermRouter = express.Router();
// middleware
const protectedRoute = require("../../../middlewares/protectedRoute");
const {
  getAcademicTermsController,
  createAcademicTermController,
  getAcademicTermController,
  updateAcademicTermController,
  deleteAcademicTermController,
} = require("../../../controllers/academic/academicTerm.controller");

const lmsManage = protectedRoute("lms.course.manage");
const lmsWrite = protectedRoute("lms.exam.manage");

academicTermRouter
  .route("/academic-term")
  .get([...lmsManage], getAcademicTermsController)
  .post([...lmsWrite], createAcademicTermController);
academicTermRouter
  .route("/academic-term/:id")
  .get([...lmsManage], getAcademicTermController)
  .patch([...lmsWrite], updateAcademicTermController)
  .delete([...lmsWrite], deleteAcademicTermController);
module.exports = academicTermRouter;
