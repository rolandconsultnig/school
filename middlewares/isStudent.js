const responseStatus = require("../handlers/responseStatus.handler");
const prisma = require("../lib/prisma");

const isStudent = async (req, res, next) => {
  const userId = req.userAuth.id;
  const student = await prisma.student.findUnique({ where: { id: userId } });
  if (student?.role === "student") {
    next();
  } else {
    responseStatus(res, 403, "failed", "Access Denied.students only route!");
  }
};
module.exports = isStudent;
