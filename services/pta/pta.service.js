const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");
const { queueNotification } = require("../foundation/notification.service");

exports.sendMessageService = async (data, sender, res) => {
  const { parentId, teacherId, studentId, body } = data;

  if (!body?.trim()) {
    return responseStatus(res, 400, "failed", "Message body is required");
  }

  const link = await prisma.parentStudent.findFirst({
    where: { parentId, studentId },
  });
  if (!link) {
    return responseStatus(res, 400, "failed", "Parent is not linked to this student");
  }

  const message = await prisma.ptaMessage.create({
    data: { parentId, teacherId, studentId, body },
  });

  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (teacher) {
    await queueNotification({
      channel: "EMAIL",
      recipient: teacher.email,
      subject: "New parent message",
      body: `You have a new PTA message regarding a student.`,
    });
  }

  return responseStatus(res, 201, "success", serializeForApi(message));
};

exports.listMessagesForParentService = async (parentId, res) => {
  const messages = await prisma.ptaMessage.findMany({
    where: { parentId },
    orderBy: { createdAt: "desc" },
    include: { teacher: true, student: true },
  });
  return responseStatus(
    res,
    200,
    "success",
    messages.map((m) => ({
      ...serializeForApi(m),
      teacherName: m.teacher.name,
      studentName: m.student.name,
    }))
  );
};

exports.listMessagesForTeacherService = async (teacherId, res) => {
  const messages = await prisma.ptaMessage.findMany({
    where: { teacherId },
    orderBy: { createdAt: "desc" },
    include: { parent: true, student: true },
  });
  return responseStatus(
    res,
    200,
    "success",
    messages.map((m) => ({
      ...serializeForApi(m),
      parentName: m.parent.name,
      studentName: m.student.name,
    }))
  );
};

exports.markMessageReadService = async (messageId, res) => {
  const message = await prisma.ptaMessage.update({
    where: { id: messageId },
    data: { isRead: true },
  });
  return responseStatus(res, 200, "success", serializeForApi(message));
};
