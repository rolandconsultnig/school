const verifyToken = require("../utils/verifyToken");
const responseStatus = require("../handlers/responseStatus.handler");

const isLoggedIn = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return responseStatus(res, 401, "failed", "Authorization token required");
  }

  const token = authHeader.split(" ")[1];
  const verify = verifyToken(token);
  if (verify) {
    req.userAuth = verify;
    return next();
  }
  return responseStatus(res, 401, "failed", "Invalid/expired token");
};

module.exports = isLoggedIn;
