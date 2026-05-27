const express = require("express");
const admissionsRouter = express.Router();
const validateBody = require("../../../middlewares/validateBody");
const { admissionInquirySchema } = require("../../../lib/validation/admissionInquiry.schema");
const {
  scheduleInterviewSchema,
  interviewScoreSchema,
  applicantStatusSchema,
} = require("../../../lib/validation/admissions.schema");
const isLoggedIn = require("../../../middlewares/isLoggedIn");
const isApplicant = require("../../../middlewares/isApplicant");
const protectedRoute = require("../../../middlewares/protectedRoute");
const { upload } = require("../../../handlers/upload.middleware");
const {
  createInquiryController,
  listInquiriesController,
  updateInquiryStatusController,
  registerApplicantController,
  applicantLoginController,
  getApplicantPortalController,
  listApplicantsController,
  getApplicantAdminController,
  uploadApplicantDocumentController,
  reviewApplicantDocumentController,
  scheduleInterviewController,
  recordInterviewScoreController,
  updateApplicantStatusController,
  enrollApplicantController,
} = require("../../../controllers/admissions/admissions.controller");

const inquiryManage = protectedRoute("admissions.inquiry.manage");
const applicantReview = protectedRoute("admissions.applicant.review");
const enrollment = protectedRoute("admissions.enrollment.execute");

// Public
admissionsRouter.post(
  "/admissions/inquiries",
  validateBody(admissionInquirySchema),
  createInquiryController
);
admissionsRouter.post("/admissions/applicants/register", registerApplicantController);
admissionsRouter.post("/admissions/applicants/login", applicantLoginController);

// Applicant portal
const applicantAuth = [isLoggedIn, isApplicant];
admissionsRouter.get(
  "/admissions/applicants/portal/me",
  applicantAuth,
  getApplicantPortalController
);
admissionsRouter.post(
  "/admissions/applicants/portal/documents",
  applicantAuth,
  uploadApplicantDocumentController
);
admissionsRouter.post(
  "/admissions/applicants/portal/documents/upload",
  [...applicantAuth, upload.single("file")],
  uploadApplicantDocumentController
);

// Admin / registrar
admissionsRouter.get(
  "/admissions/inquiries",
  [...inquiryManage],
  listInquiriesController
);
admissionsRouter.patch(
  "/admissions/inquiries/:id/status",
  [...inquiryManage],
  updateInquiryStatusController
);

admissionsRouter.get(
  "/admissions/applicants",
  [...applicantReview],
  listApplicantsController
);
admissionsRouter.get(
  "/admissions/applicants/:id",
  [...applicantReview],
  getApplicantAdminController
);
admissionsRouter.post(
  "/admissions/applicants/:id/documents",
  [...applicantReview],
  uploadApplicantDocumentController
);
admissionsRouter.post(
  "/admissions/applicants/:id/documents/upload",
  [...applicantReview, upload.single("file")],
  uploadApplicantDocumentController
);
admissionsRouter.patch(
  "/admissions/documents/:documentId/review",
  [...applicantReview],
  reviewApplicantDocumentController
);
admissionsRouter.post(
  "/admissions/applicants/:id/interview/schedule",
  [...applicantReview],
  validateBody(scheduleInterviewSchema),
  scheduleInterviewController
);
admissionsRouter.post(
  "/admissions/applicants/:id/interview/score",
  [...applicantReview],
  validateBody(interviewScoreSchema),
  recordInterviewScoreController
);
admissionsRouter.patch(
  "/admissions/applicants/:id/status",
  [...applicantReview],
  validateBody(applicantStatusSchema),
  updateApplicantStatusController
);
admissionsRouter.post(
  "/admissions/applicants/:id/enroll",
  [...enrollment],
  enrollApplicantController
);

module.exports = admissionsRouter;
