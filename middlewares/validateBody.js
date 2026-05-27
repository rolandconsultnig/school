const responseStatus = require("../handlers/responseStatus.handler");

/**
 * @param {import("zod").ZodTypeAny} schema
 */
const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const msg = result.error.issues.map((i) => i.message).join("; ");
    return responseStatus(res, 400, "failed", msg);
  }
  req.body = result.data;
  return next();
};

module.exports = validateBody;
