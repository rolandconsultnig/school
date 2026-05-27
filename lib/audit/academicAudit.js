const { logFromRequest } = require("./logFromRequest");

async function auditAcademic(req, action, entityType, entityId, payload) {
  return logFromRequest(req, {
    action,
    entityType,
    entityId,
    after: payload,
  });
}

module.exports = { auditAcademic };
