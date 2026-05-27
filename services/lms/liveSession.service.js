const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");

exports.createLiveSessionService = async (courseId, data, res) => {
  const { title, meetingUrl, scheduledAt, durationMin, notes } = data;
  if (!title || !meetingUrl || !scheduledAt) {
    return responseStatus(
      res,
      400,
      "failed",
      "title, meetingUrl, scheduledAt are required"
    );
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return responseStatus(res, 404, "failed", "Course not found");

  const session = await prisma.liveClassSession.create({
    data: {
      courseId,
      title,
      meetingUrl,
      scheduledAt: new Date(scheduledAt),
      durationMin: durationMin ?? 60,
      notes,
    },
  });

  return responseStatus(res, 201, "success", serializeForApi(session));
};

exports.listLiveSessionsService = async (courseId, res) => {
  const sessions = await prisma.liveClassSession.findMany({
    where: { courseId },
    orderBy: { scheduledAt: "asc" },
  });
  return responseStatus(
    res,
    200,
    "success",
    sessions.map((s) => serializeForApi(s))
  );
};

exports.deleteLiveSessionService = async (sessionId, res) => {
  const session = await prisma.liveClassSession.delete({
    where: { id: sessionId },
  });
  return responseStatus(res, 200, "success", serializeForApi(session));
};
