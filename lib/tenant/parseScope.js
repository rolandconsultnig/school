const { SCHOOL_TIERS } = require("../modules");

function parseTier(value) {
  if (!value) return undefined;
  const tier = String(value).toUpperCase();
  return SCHOOL_TIERS.includes(tier) ? tier : undefined;
}

function scopeFromBody(data = {}, tenant = {}) {
  return {
    campusId: data.campusId || tenant.campusId || undefined,
    tier: parseTier(data.tier || tenant.tier),
  };
}

module.exports = { parseTier, scopeFromBody };
