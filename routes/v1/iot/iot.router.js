const express = require("express");
const iotRouter = express.Router();
const protectedRoute = require("../../../middlewares/protectedRoute");
const validateBody = require("../../../middlewares/validateBody");
const {
  lockdownSchema,
  accessScanSchema,
  accessRuleSchema,
} = require("../../../lib/validation/access.schema");
const {
  listRulesController,
  createRuleController,
  recordScanController,
  listScansController,
  webhookScanController,
  accessStatusController,
  setLockdownController,
} = require("../../../controllers/iot/iot.controller");

const manageRules = protectedRoute("access.rules.manage");
const readMonitor = protectedRoute("access.monitor.read");

iotRouter.post("/access/webhook", webhookScanController);
iotRouter.get("/access/status", [...readMonitor], accessStatusController);
iotRouter.post("/access/lockdown", [...manageRules], validateBody(lockdownSchema), setLockdownController);
iotRouter.get("/access/rules", [...manageRules], listRulesController);
iotRouter.post("/access/rules", [...manageRules], validateBody(accessRuleSchema), createRuleController);
iotRouter.post("/access/scans", [...readMonitor], validateBody(accessScanSchema), recordScanController);
iotRouter.get("/access/scans", [...readMonitor], listScansController);

module.exports = iotRouter;
