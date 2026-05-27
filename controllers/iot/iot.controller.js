const responseStatus = require("../../handlers/responseStatus.handler");
const {
  listRulesService,
  createRuleService,
  recordScanService,
  listScansService,
  webhookScanService,
  getAccessStatusService,
  setLockdownService,
} = require("../../services/iot/iot.service");

exports.listRulesController = async (req, res) => {
  try {
    await listRulesService(res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.createRuleController = async (req, res) => {
  try {
    await createRuleService(req.body, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.recordScanController = async (req, res) => {
  try {
    await recordScanService(req.body, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.webhookScanController = async (req, res) => {
  try {
    const key = req.headers["x-iot-key"] || req.query.key;
    await webhookScanService(req.body, key, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.accessStatusController = async (req, res) => {
  try {
    await getAccessStatusService(req.query.campusId, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.setLockdownController = async (req, res) => {
  try {
    await setLockdownService(req.body.campusId, req.body.enabled, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listScansController = async (req, res) => {
  try {
    await listScansService(req.query, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};
