const express = require("express");
const academicYearRouter = express.Router();
const protectedRoute = require("../../../middlewares/protectedRoute");
const manage = protectedRoute("lms.course.manage");
const {
  getAcademicYearsController,
  createAcademicYearController,
  getAcademicYearController,
  updateAcademicYearController,
  deleteAcademicYearController,
} = require("../../../controllers/academic/academicYear.controller");

academicYearRouter
  .route("/academic-years")
  .get([...manage], getAcademicYearsController)
  .post([...manage], createAcademicYearController);
academicYearRouter
  .route("/academic-years/:id")
  .get([...manage], getAcademicYearController)
  .patch([...manage], updateAcademicYearController)
  .delete([...manage], deleteAcademicYearController);

module.exports = academicYearRouter;
