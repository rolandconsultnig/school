const express = require("express");
const foundationRouter = express.Router();

const isLoggedIn = require("../../../middlewares/isLoggedIn");
const attachActor = require("../../../middlewares/attachActor");
const tenantContext = require("../../../middlewares/tenantContext");
const requirePermission = require("../../../middlewares/requirePermission");

const {
  getModuleRegistryController,
  getBootstrapController,
  getTiersController,
  getGradesByTierController,
  listOrganizationsController,
  getOrganizationController,
  createOrganizationController,
  createCampusController,
  listRolesController,
  listAuditLogsController,
  queueNotificationController,
} = require("../../../controllers/foundation/foundation.controller");

const auth = [isLoggedIn, attachActor, tenantContext];

// Public catalog
foundationRouter.get("/foundation/modules", getModuleRegistryController);
foundationRouter.get("/foundation/tiers", getTiersController);
foundationRouter.get("/foundation/bootstrap", ...auth, getBootstrapController);
foundationRouter.get("/foundation/tiers/:tier/grades", getGradesByTierController);

// Organizations & campuses
foundationRouter.get(
  "/foundation/organizations",
  ...auth,
  requirePermission("system.organization.manage"),
  listOrganizationsController
);
foundationRouter.get(
  "/foundation/organizations/:id",
  ...auth,
  requirePermission("system.organization.manage"),
  getOrganizationController
);
foundationRouter.post(
  "/foundation/organizations",
  ...auth,
  requirePermission("system.organization.manage"),
  createOrganizationController
);
foundationRouter.post(
  "/foundation/organizations/:organizationId/campuses",
  ...auth,
  requirePermission("system.campus.manage"),
  createCampusController
);

// RBAC
foundationRouter.get(
  "/foundation/roles",
  ...auth,
  requirePermission("system.rbac.manage"),
  listRolesController
);

// Audit
foundationRouter.get(
  "/foundation/audit-logs",
  ...auth,
  requirePermission("system.audit.read"),
  listAuditLogsController
);

// Notifications (queue stub)
foundationRouter.post(
  "/foundation/notifications/queue",
  ...auth,
  requirePermission("system.notification.send"),
  queueNotificationController
);

module.exports = foundationRouter;
