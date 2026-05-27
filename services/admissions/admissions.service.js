const prisma = require("../../lib/prisma");
const {
  hashPassword,
  isPassMatched,
} = require("../../handlers/passHash.handler");
const generateToken = require("../../utils/tokenGenerator");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");
const { generateStudentId } = require("../../utils/entityIds");
const { scopeFromBody, parseTier } = require("../../lib/tenant/parseScope");
const { queueNotification } = require("../foundation/notification.service");

exports.createInquiryService = async (data, res) => {
  const { parentName, parentEmail, parentPhone, studentName, message, tier } =
    data;
  const { campusId } = scopeFromBody(data, {});

  if (tier && !parseTier(tier)) {
    return responseStatus(res, 400, "failed", "Invalid tier");
  }

  const inquiry = await prisma.admissionInquiry.create({
    data: {
      parentName,
      parentEmail,
      parentPhone,
      studentName,
      message,
      tier: parseTier(tier),
      campusId,
    },
  });

  await queueNotification({
    channel: "EMAIL",
    recipient: parentEmail,
    subject: "We received your inquiry",
    body: `Thank you ${parentName}. We received your inquiry for ${studentName} and will contact you shortly.`,
    campusId,
  });

  return responseStatus(res, 201, "success", serializeForApi(inquiry));
};

exports.listInquiriesService = async (status, res) => {
  const inquiries = await prisma.admissionInquiry.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return responseStatus(
    res,
    200,
    "success",
    inquiries.map((i) => serializeForApi(i))
  );
};

exports.updateInquiryStatusService = async (inquiryId, status, res) => {
  const inquiry = await prisma.admissionInquiry.update({
    where: { id: inquiryId },
    data: { status },
  });
  return responseStatus(res, 200, "success", serializeForApi(inquiry));
};

exports.registerApplicantService = async (data, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    dateOfBirth,
    gender,
    inquiryId,
  } = data;
  const { campusId, tier } = scopeFromBody(data, {});

  if (!tier || !parseTier(tier)) {
    return responseStatus(
      res,
      400,
      "failed",
      "tier is required (NURSERY, PRIMARY, SECONDARY)"
    );
  }

  const exists = await prisma.applicant.findUnique({ where: { email } });
  if (exists) {
    return responseStatus(res, 409, "failed", "Applicant email already registered");
  }

  const applicant = await prisma.applicant.create({
    data: {
      firstName,
      lastName,
      email,
      password: password ? await hashPassword(password) : null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender,
      tier: parseTier(tier),
      campusId,
      gradeLevelId: data.gradeLevelId,
      programId: data.programId,
      inquiryId,
      status: "APPLIED",
    },
  });

  if (inquiryId) {
    await prisma.admissionInquiry.update({
      where: { id: inquiryId },
      data: { status: "CONVERTED" },
    });
  }

  return responseStatus(res, 201, "success", serializeForApi(applicant));
};

exports.applicantLoginService = async (data, res) => {
  const { email, password } = data;
  const applicant = await prisma.applicant.findUnique({ where: { email } });
  if (!applicant?.password) {
    return responseStatus(res, 401, "failed", "Invalid credentials");
  }

  const matched = await isPassMatched(password, applicant.password);
  if (!matched) {
    return responseStatus(res, 401, "failed", "Invalid credentials");
  }

  return responseStatus(res, 200, "success", {
    applicant: serializeForApi(applicant),
    token: generateToken(applicant.id),
  });
};

exports.getApplicantService = async (applicantId, res) => {
  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    include: { documents: true, inquiry: true },
  });
  if (!applicant) return responseStatus(res, 404, "failed", "Applicant not found");
  return responseStatus(res, 200, "success", serializeForApi(applicant));
};

exports.listApplicantsService = async (filters, res) => {
  const { status, campusId, tier } = filters;
  const applicants = await prisma.applicant.findMany({
    where: {
      ...(status && { status }),
      ...(campusId && { campusId }),
      ...(tier && { tier: parseTier(tier) }),
    },
    include: { documents: true },
    orderBy: { createdAt: "desc" },
  });
  return responseStatus(
    res,
    200,
    "success",
    applicants.map((a) => serializeForApi(a))
  );
};

exports.uploadApplicantDocumentService = async (applicantId, data, res) => {
  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
  });
  if (!applicant) return responseStatus(res, 404, "failed", "Applicant not found");

  const doc = await prisma.applicantDocument.create({
    data: {
      applicantId,
      title: data.title,
      fileUrl: data.fileUrl,
      documentType: data.documentType || "OTHER",
    },
  });

  if (applicant.status === "APPLIED") {
    await prisma.applicant.update({
      where: { id: applicantId },
      data: { status: "DOCUMENT_REVIEW" },
    });
  }

  return responseStatus(res, 201, "success", serializeForApi(doc));
};

exports.reviewApplicantDocumentService = async (
  documentId,
  data,
  reviewerId,
  res
) => {
  const { verificationStatus, reviewComments } = data;
  const doc = await prisma.applicantDocument.update({
    where: { id: documentId },
    data: {
      verificationStatus,
      reviewComments,
      reviewedById: reviewerId,
      reviewedAt: new Date(),
    },
  });
  return responseStatus(res, 200, "success", serializeForApi(doc));
};

exports.scheduleInterviewService = async (applicantId, data, res) => {
  const applicant = await prisma.applicant.update({
    where: { id: applicantId },
    data: {
      interviewDate: new Date(data.interviewDate),
      status: "INTERVIEW_SCHEDULED",
    },
  });

  await queueNotification({
    channel: "EMAIL",
    recipient: applicant.email,
    subject: "Interview scheduled",
    body: `Your admission interview is scheduled for ${data.interviewDate}.`,
    campusId: applicant.campusId,
  });

  return responseStatus(res, 200, "success", serializeForApi(applicant));
};

exports.recordInterviewScoreService = async (applicantId, data, res) => {
  const applicant = await prisma.applicant.update({
    where: { id: applicantId },
    data: {
      interviewScore: data.interviewScore,
      interviewNotes: data.interviewNotes,
      status: "INTERVIEWED",
    },
  });
  return responseStatus(res, 200, "success", serializeForApi(applicant));
};

exports.updateApplicantStatusService = async (applicantId, status, res) => {
  const applicant = await prisma.applicant.update({
    where: { id: applicantId },
    data: { status },
  });
  return responseStatus(res, 200, "success", serializeForApi(applicant));
};

exports.enrollApplicantService = async (applicantId, adminId, data, res) => {
  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    include: { documents: { where: { verificationStatus: "APPROVED" } } },
  });

  if (!applicant) return responseStatus(res, 404, "failed", "Applicant not found");
  if (applicant.status !== "ACCEPTED") {
    return responseStatus(
      res,
      400,
      "failed",
      "Applicant must be ACCEPTED before enrollment"
    );
  }
  if (applicant.enrolledStudentId) {
    return responseStatus(res, 400, "failed", "Applicant already enrolled");
  }

  const email = data.email || applicant.email;
  const existingStudent = await prisma.student.findUnique({ where: { email } });
  if (existingStudent) {
    return responseStatus(res, 409, "failed", "Student email already exists");
  }

  const password = data.password || `Temp@${Date.now().toString().slice(-6)}`;
  const name = `${applicant.firstName} ${applicant.lastName}`;

  const student = await prisma.student.create({
    data: {
      name,
      email,
      password: await hashPassword(password),
      studentId: generateStudentId(name),
      tier: applicant.tier,
      campusId: applicant.campusId,
      gradeLevelId: applicant.gradeLevelId,
      programId: applicant.programId,
      admins: { create: { adminId } },
    },
  });

  await prisma.applicant.update({
    where: { id: applicantId },
    data: { status: "ENROLLED", enrolledStudentId: student.id },
  });

  for (const doc of applicant.documents) {
    await prisma.studentDocument.create({
      data: {
        studentId: student.id,
        title: doc.title,
        fileUrl: doc.fileUrl,
        documentType: "OTHER",
        uploadedById: adminId,
      },
    });
  }

  await queueNotification({
    channel: "EMAIL",
    recipient: email,
    subject: "Welcome — enrollment complete",
    body: `You are now enrolled. Student ID: ${student.studentId}. Login with your email.`,
    campusId: applicant.campusId,
  });

  return responseStatus(res, 201, "success", {
    student: serializeForApi(student),
    temporaryPassword: data.password ? undefined : password,
  });
};
