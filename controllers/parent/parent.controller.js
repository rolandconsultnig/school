const responseStatus = require("../../handlers/responseStatus.handler");
const {
  registerParentService,
  parentLoginService,
  parentDashboardService,
  linkChildService,
} = require("../../services/parent/parent.service");
const { getChildSummaryService } = require("../../services/parent/parentChild.service");

exports.registerParentController = async (req, res) => {
  try {
    await registerParentService(req.body, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.parentLoginController = async (req, res) => {
  try {
    await parentLoginService(req.body, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.parentDashboardController = async (req, res) => {
  try {
    const parentId = req.parent?.id || req.userAuth.id;
    await parentDashboardService(parentId, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.linkChildController = async (req, res) => {
  try {
    const { parentId } = req.params;
    const { studentId, relationship } = req.body;
    await linkChildService(parentId, studentId, relationship, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.childSummaryController = async (req, res) => {
  try {
    const parentId = req.parent?.id || req.userAuth.id;
    await getChildSummaryService(parentId, req.params.studentId, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};
