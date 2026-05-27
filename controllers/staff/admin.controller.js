const responseStatus = require("../../handlers/responseStatus.handler");
const { createAuditLog } = require("../../lib/audit/createAuditLog");
const {
  registerAdminService,
  getAdminsService,
  loginAdminService,
  getSingleProfileService,
  updateAdminService,
  bootstrapAdminService,
  deleteAdminService,
} = require("../../services/staff/admin.service");
const {
  suspendTeacherService,
  unsuspendTeacherService,
  withdrawTeacherService,
  unwithdrawTeacherService,
} = require("../../services/staff/teachers.service");
const {
  adminPublishResultService,
  adminUnpublishResultService,
} = require("../../services/academic/results.service");

exports.bootstrapAdminController = async (req, res) => {
  try {
    await bootstrapAdminService(req.body, res);
  } catch (error) {
    responseStatus(res, 400, "failed", error.message);
  }
};

exports.registerAdminController = async (req, res) => {
  try {
    await registerAdminService(req.body, res);
    await createAuditLog({
      actor: req.actor,
      action: "CREATE",
      entityType: "Admin",
      module: 0,
      after: { email: req.body.email },
      ipAddress: req.ip,
    });
  } catch (error) {
    responseStatus(res, 400, "failed", error.message);
  }
};

exports.loginAdminController = async (req, res) => {
  try {
    await loginAdminService(req.body, res);
  } catch (error) {
    responseStatus(res, 400, "failed", error.message);
  }
};

exports.getAdminsController = async (req, res) => {
  try {
    const result = await getAdminsService();
    responseStatus(res, 200, "success", result);
  } catch (error) {
    responseStatus(res, 400, "failed", error.message);
  }
};

exports.getAdminProfileController = async (req, res) => {
  try {
    await getSingleProfileService(req.userAuth.id, res);
  } catch (error) {
    responseStatus(res, 400, "failed", error.message);
  }
};

exports.updateAdminController = async (req, res) => {
  try {
    await updateAdminService(req.userAuth.id, req.body, res);
    await createAuditLog({
      actor: req.actor,
      action: "UPDATE",
      entityType: "Admin",
      entityId: req.userAuth.id,
      module: 0,
      ipAddress: req.ip,
    });
  } catch (error) {
    responseStatus(res, 400, "failed", error.message);
  }
};

exports.deleteAdminController = async (req, res) => {
  try {
    await deleteAdminService(req.params.id, req.userAuth.id, res);
    await createAuditLog({
      actor: req.actor,
      action: "DELETE",
      entityType: "Admin",
      entityId: req.params.id,
      module: 0,
      ipAddress: req.ip,
    });
  } catch (error) {
    responseStatus(res, 400, "failed", error.message);
  }
};

exports.adminSuspendTeacherController = async (req, res) => {
  try {
    await suspendTeacherService(req.params.id, res);
    await createAuditLog({
      actor: req.actor,
      action: "UPDATE",
      entityType: "Teacher",
      entityId: req.params.id,
      module: 9,
      after: { isSuspended: true },
      ipAddress: req.ip,
    });
  } catch (error) {
    responseStatus(res, 400, "failed", error.message);
  }
};

exports.adminUnSuspendTeacherController = async (req, res) => {
  try {
    await unsuspendTeacherService(req.params.id, res);
    await createAuditLog({
      actor: req.actor,
      action: "UPDATE",
      entityType: "Teacher",
      entityId: req.params.id,
      module: 9,
      after: { isSuspended: false },
      ipAddress: req.ip,
    });
  } catch (error) {
    responseStatus(res, 400, "failed", error.message);
  }
};

exports.adminWithdrawTeacherController = async (req, res) => {
  try {
    await withdrawTeacherService(req.params.id, res);
    await createAuditLog({
      actor: req.actor,
      action: "UPDATE",
      entityType: "Teacher",
      entityId: req.params.id,
      module: 9,
      after: { isWithdrawn: true },
      ipAddress: req.ip,
    });
  } catch (error) {
    responseStatus(res, 400, "failed", error.message);
  }
};

exports.adminUnWithdrawTeacherController = async (req, res) => {
  try {
    await unwithdrawTeacherService(req.params.id, res);
    await createAuditLog({
      actor: req.actor,
      action: "UPDATE",
      entityType: "Teacher",
      entityId: req.params.id,
      module: 9,
      after: { isWithdrawn: false },
      ipAddress: req.ip,
    });
  } catch (error) {
    responseStatus(res, 400, "failed", error.message);
  }
};

exports.adminPublishResultsController = async (req, res) => {
  try {
    await adminPublishResultService(req.params.id, res);
    await createAuditLog({
      actor: req.actor,
      action: "PUBLISH",
      entityType: "ExamResult",
      entityId: req.params.id,
      module: 6,
      after: { isPublished: true },
      ipAddress: req.ip,
    });
  } catch (error) {
    responseStatus(res, 400, "failed", error.message);
  }
};

exports.adminUnPublishResultsController = async (req, res) => {
  try {
    await adminUnpublishResultService(req.params.id, res);
    await createAuditLog({
      actor: req.actor,
      action: "UPDATE",
      entityType: "ExamResult",
      entityId: req.params.id,
      module: 6,
      after: { isPublished: false },
      ipAddress: req.ip,
    });
  } catch (error) {
    responseStatus(res, 400, "failed", error.message);
  }
};
