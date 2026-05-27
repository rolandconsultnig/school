const { resolveActor } = require("../lib/rbac/resolveActor");

/**
 * Attaches req.actor after isLoggedIn (uses req.userAuth.id from JWT).
 */
const attachActor = async (req, res, next) => {
  try {
    const actor = await resolveActor(req.userAuth.id);
    if (!actor) {
      return res.status(401).json({ status: "failed", message: "User not found" });
    }
    req.actor = actor;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = attachActor;
