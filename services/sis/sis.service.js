const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");

const studentProfileInclude = {
  campus: true,
  gradeLevel: true,
  program: true,
  academicYear: true,
  health: true,
  emergencyContacts: { orderBy: { isPrimary: "desc" } },
  documents: { orderBy: { createdAt: "desc" } },
  classLevels: { include: { classLevel: true } },
};

exports.getStudent360Service = async (studentId, res) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: studentProfileInclude,
  });
  if (!student) return responseStatus(res, 404, "failed", "Student not found");

  const data = serializeForApi(student);
  data.classLevels = student.classLevels.map((r) =>
    serializeForApi(r.classLevel)
  );
  return responseStatus(res, 200, "success", data);
};

exports.upsertStudentHealthService = async (studentId, data, res) => {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return responseStatus(res, 404, "failed", "Student not found");

  const health = await prisma.studentHealth.upsert({
    where: { studentId },
    create: { studentId, ...pickHealth(data) },
    update: pickHealth(data),
  });
  return responseStatus(res, 200, "success", serializeForApi(health));
};

exports.addEmergencyContactService = async (studentId, data, res) => {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return responseStatus(res, 404, "failed", "Student not found");

  if (data.isPrimary) {
    await prisma.emergencyContact.updateMany({
      where: { studentId },
      data: { isPrimary: false },
    });
  }

  const contact = await prisma.emergencyContact.create({
    data: {
      studentId,
      name: data.name,
      relationship: data.relationship,
      phone: data.phone,
      email: data.email,
      address: data.address,
      isPrimary: !!data.isPrimary,
    },
  });
  return responseStatus(res, 201, "success", serializeForApi(contact));
};

exports.updateEmergencyContactService = async (contactId, data, res) => {
  const existing = await prisma.emergencyContact.findUnique({
    where: { id: contactId },
  });
  if (!existing) return responseStatus(res, 404, "failed", "Contact not found");

  if (data.isPrimary) {
    await prisma.emergencyContact.updateMany({
      where: { studentId: existing.studentId },
      data: { isPrimary: false },
    });
  }

  const contact = await prisma.emergencyContact.update({
    where: { id: contactId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.relationship && { relationship: data.relationship }),
      ...(data.phone && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.isPrimary !== undefined && { isPrimary: data.isPrimary }),
    },
  });
  return responseStatus(res, 200, "success", serializeForApi(contact));
};

exports.deleteEmergencyContactService = async (contactId, res) => {
  const existing = await prisma.emergencyContact.findUnique({
    where: { id: contactId },
  });
  if (!existing) return responseStatus(res, 404, "failed", "Contact not found");
  await prisma.emergencyContact.delete({ where: { id: contactId } });
  return responseStatus(res, 200, "success", serializeForApi(existing));
};

exports.addStudentDocumentService = async (studentId, data, uploadedById, res) => {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return responseStatus(res, 404, "failed", "Student not found");

  if (!data.title || !data.fileUrl) {
    return responseStatus(res, 400, "failed", "title and fileUrl are required");
  }

  const doc = await prisma.studentDocument.create({
    data: {
      studentId,
      title: data.title,
      fileUrl: data.fileUrl,
      documentType: data.documentType || "OTHER",
      description: data.description,
      issuedAt: data.issuedAt ? new Date(data.issuedAt) : null,
      uploadedById,
    },
  });
  return responseStatus(res, 201, "success", serializeForApi(doc));
};

exports.listStudentDocumentsService = async (studentId, res) => {
  const docs = await prisma.studentDocument.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
  });
  return responseStatus(
    res,
    200,
    "success",
    docs.map((d) => serializeForApi(d))
  );
};

exports.deleteStudentDocumentService = async (documentId, res) => {
  const doc = await prisma.studentDocument.findUnique({
    where: { id: documentId },
  });
  if (!doc) return responseStatus(res, 404, "failed", "Document not found");
  await prisma.studentDocument.delete({ where: { id: documentId } });
  return responseStatus(res, 200, "success", serializeForApi(doc));
};

function pickHealth(data) {
  return {
    ...(data.bloodGroup !== undefined && { bloodGroup: data.bloodGroup }),
    ...(data.allergies !== undefined && { allergies: data.allergies }),
    ...(data.medicalConditions !== undefined && {
      medicalConditions: data.medicalConditions,
    }),
    ...(data.medications !== undefined && { medications: data.medications }),
    ...(data.doctorName !== undefined && { doctorName: data.doctorName }),
    ...(data.doctorPhone !== undefined && { doctorPhone: data.doctorPhone }),
    ...(data.notes !== undefined && { notes: data.notes }),
  };
}
