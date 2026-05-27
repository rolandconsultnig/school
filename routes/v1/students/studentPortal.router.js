const express = require("express");
const studentPortalRouter = express.Router();
const isLoggedIn = require("../../../middlewares/isLoggedIn");
const isStudent = require("../../../middlewares/isStudent");
const {
  getDashboardController,
  getMyAttendanceController,
  getMyFeesController,
  getMyLibraryController,
  searchLibraryCatalogController,
  getMyAccessLogsController,
  getAnnouncementsController,
  getWalletController,
  createDocumentRequestController,
  listDocumentRequestsController,
  submitFeedbackController,
  sendMessageController,
  listMyMessagesController,
  getTransportController,
  getRegistrationCatalogController,
  listUpcomingAssignmentsController,
  listMyExamsController,
  listMyTeachersController,
  initializeStudentPaystackController,
} = require("../../../controllers/students/studentPortal.controller");

const auth = [isLoggedIn, isStudent];

studentPortalRouter.get("/students/portal/dashboard", auth, getDashboardController);
studentPortalRouter.get("/students/portal/attendance", auth, getMyAttendanceController);
studentPortalRouter.get("/students/portal/fees", auth, getMyFeesController);
studentPortalRouter.post(
  "/students/portal/fees/:feeId/payments/paystack/initialize",
  auth,
  initializeStudentPaystackController
);
studentPortalRouter.get("/students/portal/library", auth, getMyLibraryController);
studentPortalRouter.get("/students/portal/library/catalog", auth, searchLibraryCatalogController);
studentPortalRouter.get("/students/portal/access-logs", auth, getMyAccessLogsController);
studentPortalRouter.get("/students/portal/announcements", auth, getAnnouncementsController);
studentPortalRouter.get("/students/portal/wallet", auth, getWalletController);
studentPortalRouter.get("/students/portal/document-requests", auth, listDocumentRequestsController);
studentPortalRouter.post("/students/portal/document-requests", auth, createDocumentRequestController);
studentPortalRouter.post("/students/portal/feedback", auth, submitFeedbackController);
studentPortalRouter.get("/students/portal/messages", auth, listMyMessagesController);
studentPortalRouter.post("/students/portal/messages", auth, sendMessageController);
studentPortalRouter.get("/students/portal/transport", auth, getTransportController);
studentPortalRouter.get("/students/portal/registration", auth, getRegistrationCatalogController);
studentPortalRouter.get("/students/portal/assignments", auth, listUpcomingAssignmentsController);
studentPortalRouter.get("/students/portal/exams", auth, listMyExamsController);
studentPortalRouter.get("/students/portal/teachers", auth, listMyTeachersController);

module.exports = studentPortalRouter;
