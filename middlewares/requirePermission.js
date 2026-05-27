const responseStatus = require("../handlers/responseStatus.handler");
const { checkPermission } = require("../lib/rbac/checkPermission");

/**
 * @param {string} permissionCode - e.g. "sis.student.manage"
 */
const requirePermission = (permissionCode) => async (req, res, next) => {
  try {
    const allowed = await checkPermission(req.actor, permissionCode, req.tenant || {});
    if (!allowed) {
      return responseStatus(
        res,
        403,
        "failed",
        `Access denied. Required permission: ${permissionCode}`
      );
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = requirePermission;
