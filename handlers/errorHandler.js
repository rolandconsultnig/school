const responseStatus = require("./responseStatus.handler");

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error(err);
  const status = err.statusCode || 500;
  const message = err.message || "Internal server error";
  return responseStatus(res, status, "failed", message);
};

module.exports = errorHandler;
