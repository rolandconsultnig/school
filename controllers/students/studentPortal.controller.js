const responseStatus = require("../../handlers/responseStatus.handler");
const {
  getDashboardService,
  getMyAttendanceService,
  getMyFeesService,
  getMyLibraryService,
  searchLibraryCatalogService,
  getMyAccessLogsService,
  getAnnouncementsService,
  getWalletService,
  createDocumentRequestService,
  listDocumentRequestsService,
  submitFeedbackService,
  sendMessageService,
  listMyMessagesService,
  getTransportService,
  getRegistrationCatalogService,
  listUpcomingAssignmentsService,
  listMyExamsService,
  listMyTeachersService,
} = require("../../services/studentPortal/studentPortal.service");
const {
  initializeStudentPaystackController,
} = require("../finance/payment.controller");

const sid = (req) => req.userAuth.id;

exports.initializeStudentPaystackController = initializeStudentPaystackController;

exports.getDashboardController = async (req, res) => {
  try {
    await getDashboardService(sid(req), res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.getMyAttendanceController = async (req, res) => {
  try {
    await getMyAttendanceService(sid(req), req.query, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.getMyFeesController = async (req, res) => {
  try {
    await getMyFeesService(sid(req), res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.searchLibraryCatalogController = async (req, res) => {
  try {
    await searchLibraryCatalogService(sid(req), req.query, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.getMyLibraryController = async (req, res) => {
  try {
    await getMyLibraryService(sid(req), res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.getMyAccessLogsController = async (req, res) => {
  try {
    await getMyAccessLogsService(sid(req), res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.getAnnouncementsController = async (req, res) => {
  try {
    await getAnnouncementsService(sid(req), res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.getWalletController = async (req, res) => {
  try {
    await getWalletService(sid(req), res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.createDocumentRequestController = async (req, res) => {
  try {
    await createDocumentRequestService(sid(req), req.body, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listDocumentRequestsController = async (req, res) => {
  try {
    await listDocumentRequestsService(sid(req), res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.submitFeedbackController = async (req, res) => {
  try {
    await submitFeedbackService(sid(req), req.body, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.sendMessageController = async (req, res) => {
  try {
    await sendMessageService(sid(req), req.body, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listMyMessagesController = async (req, res) => {
  try {
    await listMyMessagesService(sid(req), res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.getTransportController = async (req, res) => {
  try {
    await getTransportService(sid(req), res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.getRegistrationCatalogController = async (req, res) => {
  try {
    await getRegistrationCatalogService(sid(req), res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listMyTeachersController = async (req, res) => {
  try {
    await listMyTeachersService(sid(req), res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listMyExamsController = async (req, res) => {
  try {
    await listMyExamsService(sid(req), res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listUpcomingAssignmentsController = async (req, res) => {
  try {
    await listUpcomingAssignmentsService(sid(req), res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};
