const responseStatus = require("../../handlers/responseStatus.handler");
const {
  createLeaveRequestService,
  listLeaveRequestsService,
  reviewLeaveRequestService,
} = require("../../services/hr/hr.service");
const {
  createPayrollRunService,
  listPayrollRunsService,
  addPayrollLineService,
  approvePayrollRunService,
} = require("../../services/hr/payroll.service");
const {
  listPerformanceReviewsService,
  createPerformanceReviewService,
  updatePerformanceReviewService,
} = require("../../services/hr/performance.service");

exports.createLeaveRequestController = async (req, res) => {
  try {
    await createLeaveRequestService(req.body, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listLeaveRequestsController = async (req, res) => {
  try {
    await listLeaveRequestsService(req.query, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.reviewLeaveRequestController = async (req, res) => {
  try {
    await reviewLeaveRequestService(
      req.params.id,
      req.body,
      req.actor.profileId,
      res
    );
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.createPayrollRunController = async (req, res) => {
  try {
    await createPayrollRunService(req.body, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listPayrollRunsController = async (req, res) => {
  try {
    await listPayrollRunsService(req.query, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.addPayrollLineController = async (req, res) => {
  try {
    await addPayrollLineService(req.params.runId, req.body, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.approvePayrollRunController = async (req, res) => {
  try {
    await approvePayrollRunService(req.params.runId, req.body.status, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listPerformanceReviewsController = async (req, res) => {
  try {
    await listPerformanceReviewsService(req.query, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.createPerformanceReviewController = async (req, res) => {
  try {
    await createPerformanceReviewService(
      { ...req.body, reviewedById: req.actor?.profileId },
      res
    );
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.updatePerformanceReviewController = async (req, res) => {
  try {
    await updatePerformanceReviewService(req.params.id, req.body, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};
