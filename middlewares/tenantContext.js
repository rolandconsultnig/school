const { SCHOOL_TIERS } = require("../lib/modules");

/**
 * Reads multi-tenant context from headers into req.tenant.
 * X-Campus-Id: uuid
 * X-Tier: NURSERY | PRIMARY | SECONDARY
 */
const tenantContext = (req, res, next) => {
  const campusId = req.headers["x-campus-id"] || req.actor?.campusId || null;
  const tierHeader = (req.headers["x-tier"] || req.actor?.tier || "")
    .toString()
    .toUpperCase();

  const tier = SCHOOL_TIERS.includes(tierHeader) ? tierHeader : null;

  req.tenant = { campusId, tier };
  next();
};

module.exports = tenantContext;
