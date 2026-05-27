const express = require("express");
const lmsRouter = express.Router();
const isLoggedIn = require("../../../middlewares/isLoggedIn");
const isStudent = require("../../../middlewares/isStudent");
const protectedRoute = require("../../../middlewares/protectedRoute");
const {
  createCourseController,
  listCoursesController,
  getCourseController,
  updateCourseController,
  enrollStudentsController,
  listStudentCoursesController,
  getStudentCourseController,
  createAssignmentController,
  listAssignmentsController,
  updateAssignmentController,
  submitAssignmentController,
  gradeSubmissionController,
  listSubmissionsController,
  createLiveSessionController,
  listLiveSessionsController,
  deleteLiveSessionController,
  getCourseGradebookController,
  getStudentGradebookController,
} = require("../../../controllers/lms/lms.controller");

const manageCourse = protectedRoute("lms.course.manage");
const manageAssignment = protectedRoute("lms.assignment.manage");
const readGrade = protectedRoute("lms.grade.read");
const studentAuth = [isLoggedIn, isStudent];

lmsRouter.post("/lms/courses", [...manageCourse], createCourseController);
lmsRouter.get("/lms/courses", [...manageCourse], listCoursesController);
lmsRouter.get("/lms/courses/:courseId", [...readGrade], getCourseController);
lmsRouter.patch("/lms/courses/:courseId", [...manageCourse], updateCourseController);
lmsRouter.post(
  "/lms/courses/:courseId/enroll",
  [...manageCourse],
  enrollStudentsController
);

lmsRouter.post(
  "/lms/courses/:courseId/assignments",
  [...manageAssignment],
  createAssignmentController
);
lmsRouter.get(
  "/lms/courses/:courseId/assignments",
  [...readGrade],
  listAssignmentsController
);
lmsRouter.patch(
  "/lms/assignments/:assignmentId",
  [...manageAssignment],
  updateAssignmentController
);
lmsRouter.get(
  "/lms/assignments/:assignmentId/submissions",
  [...manageAssignment],
  listSubmissionsController
);
lmsRouter.patch(
  "/lms/submissions/:submissionId/grade",
  [...manageAssignment],
  gradeSubmissionController
);

lmsRouter.post(
  "/lms/courses/:courseId/live-sessions",
  [...manageCourse],
  createLiveSessionController
);
lmsRouter.get(
  "/lms/courses/:courseId/live-sessions",
  [...readGrade],
  listLiveSessionsController
);
lmsRouter.delete(
  "/lms/live-sessions/:sessionId",
  [...manageCourse],
  deleteLiveSessionController
);

lmsRouter.get(
  "/lms/courses/:courseId/gradebook",
  [...readGrade],
  getCourseGradebookController
);

lmsRouter.get("/lms/student/courses", studentAuth, listStudentCoursesController);
lmsRouter.get(
  "/lms/student/courses/:courseId",
  studentAuth,
  getStudentCourseController
);
lmsRouter.post(
  "/lms/assignments/:assignmentId/submit",
  studentAuth,
  submitAssignmentController
);
lmsRouter.get("/lms/student/gradebook", studentAuth, getStudentGradebookController);
lmsRouter.get(
  "/lms/students/:studentId/gradebook",
  [...readGrade],
  getStudentGradebookController
);

module.exports = lmsRouter;
