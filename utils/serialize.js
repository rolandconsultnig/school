const PASSWORD_FIELDS = new Set(["password"]);

/**
 * Maps Prisma records to a Mongoose-like shape (_id) for API compatibility.
 */
function serializeForApi(value, { excludePassword = true } = {}) {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) {
    return value.map((item) => serializeForApi(item, { excludePassword }));
  }
  if (typeof value !== "object") return value;

  const result = {};
  for (const [key, val] of Object.entries(value)) {
    if (excludePassword && PASSWORD_FIELDS.has(key)) continue;
    if (key === "id") {
      result._id = val;
      result.id = val;
      continue;
    }
    if (val !== null && typeof val === "object" && !(val instanceof Date)) {
      result[key] = serializeForApi(val, { excludePassword });
    } else {
      result[key] = val;
    }
  }
  return result;
}

module.exports = { serializeForApi };
