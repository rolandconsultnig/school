const responseStatus = require("../../handlers/responseStatus.handler");
const { publicFileUrl } = require("../../handlers/upload.middleware");
const { logFromRequest } = require("../../lib/audit/logFromRequest");
const {
  createInquiryService,
  listInquiriesService,
  updateInquiryStatusService,
  registerApplicantService,
  applicantLoginService,
  getApplicantService,
  listApplicantsService,
  uploadApplicantDocumentService,
  reviewApplicantDocumentService,
  scheduleInterviewService,
  recordInterviewScoreService,
  updateApplicantStatusService,
  enrollApplicantService,
} = require("../../services/admissions/admissions.service");

exports.createInquiryController = async (req, res) => {
  try {
    await createInquiryService(req.body, res);
    await logFromRequest(req, {
      action: "CREATE",
      entityType: "AdmissionInquiry",
      after: req.body,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listInquiriesController = async (req, res) => {
  try {
    await listInquiriesService(req.query.status, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.updateInquiryStatusController = async (req, res) => {
  try {
    await updateInquiryStatusService(req.params.id, req.body.status, res);
    await logFromRequest(req, {
      action: "UPDATE",
      entityType: "AdmissionInquiry",
      entityId: req.params.id,
      after: { status: req.body.status },
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.registerApplicantController = async (req, res) => {
  try {
    await registerApplicantService(req.body, res);
    await logFromRequest(req, {
      action: "CREATE",
      entityType: "Applicant",
      after: { email: req.body.email },
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.applicantLoginController = async (req, res) => {
  try {
    await applicantLoginService(req.body, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.getApplicantPortalController = async (req, res) => {
  try {
    await getApplicantService(req.userAuth.id, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listApplicantsController = async (req, res) => {
  try {
    await listApplicantsService(req.query, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.getApplicantAdminController = async (req, res) => {
  try {
    await getApplicantService(req.params.id, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.uploadApplicantDocumentController = async (req, res) => {
  try {
    const applicantId = req.applicant?.id || req.params.id;
    const payload = { ...req.body };
    if (req.file) {
      payload.fileUrl = await publicFileUrl(req, req.file.filename);
    }
    await uploadApplicantDocumentService(applicantId, payload, res);
    await logFromRequest(req, {
      action: "CREATE",
      entityType: "ApplicantDocument",
      entityId: applicantId,
      after: payload,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.reviewApplicantDocumentController = async (req, res) => {
  try {
    await reviewApplicantDocumentService(
      req.params.documentId,
      req.body,
      req.userAuth.id,
      res
    );
    await logFromRequest(req, {
      action: "UPDATE",
      entityType: "ApplicantDocument",
      entityId: req.params.documentId,
      after: req.body,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.scheduleInterviewController = async (req, res) => {
  try {
    await scheduleInterviewService(req.params.id, req.body, res);
    await logFromRequest(req, {
      action: "UPDATE",
      entityType: "Applicant",
      entityId: req.params.id,
      after: req.body,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.recordInterviewScoreController = async (req, res) => {
  try {
    await recordInterviewScoreService(req.params.id, req.body, res);
    await logFromRequest(req, {
      action: "UPDATE",
      entityType: "Applicant",
      entityId: req.params.id,
      after: req.body,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.updateApplicantStatusController = async (req, res) => {
  try {
    await updateApplicantStatusService(req.params.id, req.body.status, res);
    await logFromRequest(req, {
      action: "UPDATE",
      entityType: "Applicant",
      entityId: req.params.id,
      after: { status: req.body.status },
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.enrollApplicantController = async (req, res) => {
  try {
    await enrollApplicantService(
      req.params.id,
      req.userAuth.id,
      req.body,
      res
    );
    await logFromRequest(req, {
      action: "ENROLL",
      entityType: "Applicant",
      entityId: req.params.id,
      after: req.body,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};
