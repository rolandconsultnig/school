const express = require("express");
const studentsRouter = express.Router();

const isStudent = require("../../../middlewares/isStudent");
const protectedRoute = require("../../../middlewares/protectedRoute");

const {
  adminRegisterStudentController,
  studentLoginController,
  getStudentProfileController,
  getAllStudentsByAdminController,
  getStudentByAdminController,
  studentUpdateProfileController,
  adminUpdateStudentController,
  studentWriteExamController,
} = require("../../../controllers/students/students.controller");

const auth = protectedRoute();
const manageStudents = protectedRoute("sis.student.manage");

studentsRouter
  .route("/students/admin/register")
  .post([...manageStudents], adminRegisterStudentController);

studentsRouter.route("/students/login").post(studentLoginController);

studentsRouter
  .route("/students/profile")
  .get([...auth, isStudent], getStudentProfileController);

studentsRouter
  .route("/admin/students")
  .get([...manageStudents], getAllStudentsByAdminController);

studentsRouter
  .route("/:studentId/admin")
  .get([...manageStudents], getStudentByAdminController);

studentsRouter
  .route("/update")
  .patch([...auth, isStudent], studentUpdateProfileController);

studentsRouter
  .route("/:studentId/update/admin")
  .patch([...manageStudents], adminUpdateStudentController);

studentsRouter
  .route("/students/:examId/exam-write")
  .post([...auth, isStudent], studentWriteExamController);

module.exports = studentsRouter;
