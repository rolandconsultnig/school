const responseStatus = require("../handlers/responseStatus.handler");
const prisma = require("../lib/prisma");

const isTeacher = async (req, res, next) => {
  const userId = req.userAuth.id;
  const teacher = await prisma.teacher.findUnique({ where: { id: userId } });
  if (teacher?.role === "teacher") {
    next();
  } else {
    responseStatus(res, 403, "failed", "Access Denied.teachers only route!");
  }
};
module.exports = isTeacher;
