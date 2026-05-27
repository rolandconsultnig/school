const isLoggedIn = require("./isLoggedIn");
const attachActor = require("./attachActor");
const tenantContext = require("./tenantContext");
const requirePermission = require("./requirePermission");

/**
 * Standard auth chain: JWT → actor → tenant → optional permission.
 * @param {string} [permission] - e.g. "lms.grade.publish"
 */
function protectedRoute(permission) {
  const chain = [isLoggedIn, attachActor, tenantContext];
  if (permission) chain.push(requirePermission(permission));
  return chain;
}

module.exports = protectedRoute;
