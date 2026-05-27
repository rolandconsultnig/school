const responseStatus = require("../../handlers/responseStatus.handler");
const { createAuditLog } = require("../../lib/audit/createAuditLog");
const {
  getModuleRegistryService,
  getBootstrapService,
  getTiersService,
  getGradesByTierService,
  listOrganizationsService,
  getOrganizationService,
  createOrganizationService,
  createCampusService,
  listRolesService,
  listAuditLogsService,
  queueNotificationService,
} = require("../../services/foundation/foundation.service");
const { serializeForApi } = require("../../utils/serialize");

exports.getModuleRegistryController = (req, res) => {
  responseStatus(res, 200, "success", getModuleRegistryService());
};

exports.getBootstrapController = async (req, res) => {
  try {
    const result = await getBootstrapService();
    responseStatus(res, 200, "success", result);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.getTiersController = async (req, res) => {
  try {
    const result = await getTiersService();
    responseStatus(res, 200, "success", result);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.getGradesByTierController = async (req, res) => {
  try {
    await getGradesByTierService(req.params.tier.toUpperCase(), res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listOrganizationsController = async (req, res) => {
  try {
    const result = await listOrganizationsService();
    responseStatus(res, 200, "success", result);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.getOrganizationController = async (req, res) => {
  try {
    const result = await getOrganizationService(req.params.id);
    if (!result) return responseStatus(res, 404, "failed", "Organization not found");
    responseStatus(res, 200, "success", result);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.createOrganizationController = async (req, res) => {
  try {
    await createOrganizationService(req.body, res);
    await createAuditLog({
      actor: req.actor,
      action: "CREATE",
      entityType: "Organization",
      module: 0,
      after: req.body,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.createCampusController = async (req, res) => {
  try {
    await createCampusService(req.params.organizationId, req.body, res);
    await createAuditLog({
      actor: req.actor,
      action: "CREATE",
      entityType: "Campus",
      module: 0,
      after: req.body,
      campusId: req.tenant?.campusId,
      ipAddress: req.ip,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listRolesController = async (req, res) => {
  try {
    const result = await listRolesService();
    responseStatus(res, 200, "success", result);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listAuditLogsController = async (req, res) => {
  try {
    const logs = await listAuditLogsService({
      campusId: req.tenant?.campusId || req.query.campusId,
      limit: Number(req.query.limit) || 50,
    });
    responseStatus(res, 200, "success", logs.map((l) => serializeForApi(l)));
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.queueNotificationController = async (req, res) => {
  try {
    await queueNotificationService(req.body, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};
