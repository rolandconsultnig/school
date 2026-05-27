const responseStatus = require("../handlers/responseStatus.handler");
const prisma = require("../lib/prisma");

const isAdmin = async (req, res, next) => {
  const userId = req.userAuth.id;
  const admin = await prisma.admin.findUnique({ where: { id: userId } });
  if (admin?.role === "admin") {
    next();
  } else {
    responseStatus(res, 403, "failed", "Access Denied.admin only route!");
  }
};
module.exports = isAdmin;
