/**
 * Product module registry (Modules 0–12).
 */
const MODULES = {
  INFRASTRUCTURE: 0,
  ADMISSIONS: 1,
  SIS: 2,
  ID_CARD: 3,
  IOT_ACCESS: 4,
  ATTENDANCE: 5,
  LMS: 6,
  LIBRARY: 7,
  FINANCE: 8,
  HR: 9,
  PTA: 10,
  ANCILLARY: 11,
  ANALYTICS: 12,
};

const SCHOOL_TIERS = ["NURSERY", "PRIMARY", "SECONDARY"];

const TIER_LABELS = {
  NURSERY: "Nursery",
  PRIMARY: "Primary",
  SECONDARY: "Secondary",
};

module.exports = { MODULES, SCHOOL_TIERS, TIER_LABELS };
