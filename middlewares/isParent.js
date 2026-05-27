const prisma = require("../lib/prisma");
const responseStatus = require("../handlers/responseStatus.handler");

const isParent = async (req, res, next) => {
  const parent = await prisma.parent.findUnique({
    where: { id: req.userAuth.id },
  });
  if (parent) {
    req.parent = parent;
    return next();
  }
  return responseStatus(res, 403, "failed", "Access denied. Parents only.");
};

module.exports = isParent;
