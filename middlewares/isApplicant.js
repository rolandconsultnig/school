const prisma = require("../lib/prisma");
const responseStatus = require("../handlers/responseStatus.handler");

const isApplicant = async (req, res, next) => {
  const applicant = await prisma.applicant.findUnique({
    where: { id: req.userAuth.id },
  });
  if (applicant && applicant.status !== "ENROLLED") {
    req.applicant = applicant;
    return next();
  }
  return responseStatus(res, 403, "failed", "Access denied. Applicants only.");
};

module.exports = isApplicant;
