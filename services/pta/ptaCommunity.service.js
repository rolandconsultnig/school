const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");

exports.listMeetingsService = async (query, res) => {
  const rows = await prisma.ptaMeeting.findMany({
    where: query.campusId ? { campusId: query.campusId } : {},
    orderBy: { startsAt: "asc" },
    take: 50,
  });
  return responseStatus(res, 200, "success", rows.map(serializeForApi));
};

exports.createMeetingService = async (data, res) => {
  const row = await prisma.ptaMeeting.create({
    data: {
      campusId: data.campusId,
      title: data.title,
      body: data.body,
      location: data.location,
      startsAt: new Date(data.startsAt),
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      createdById: data.createdById,
    },
  });
  return responseStatus(res, 201, "success", serializeForApi(row));
};

exports.rsvpMeetingService = async (meetingId, parentId, status, res) => {
  const row = await prisma.ptaMeetingRsvp.upsert({
    where: { meetingId_parentId: { meetingId, parentId } },
    create: { meetingId, parentId, status: status || "GOING" },
    update: { status: status || "GOING" },
  });
  return responseStatus(res, 200, "success", serializeForApi(row));
};

exports.listPollsService = async (query, res) => {
  const rows = await prisma.ptaPoll.findMany({
    where: {
      isActive: true,
      ...(query.campusId && { campusId: query.campusId }),
    },
    include: { options: true, _count: { select: { votes: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return responseStatus(
    res,
    200,
    "success",
    rows.map((p) => ({
      ...serializeForApi(p),
      options: p.options.map(serializeForApi),
      voteCount: p._count.votes,
    }))
  );
};

exports.createPollService = async (data, res) => {
  const row = await prisma.ptaPoll.create({
    data: {
      campusId: data.campusId,
      question: data.question,
      closesAt: data.closesAt ? new Date(data.closesAt) : null,
      options: {
        create: (data.options || []).map((label) => ({ label })),
      },
    },
    include: { options: true },
  });
  return responseStatus(res, 201, "success", {
    ...serializeForApi(row),
    options: row.options.map(serializeForApi),
  });
};

exports.votePollService = async (pollId, parentId, optionId, res) => {
  const option = await prisma.ptaPollOption.findFirst({
    where: { id: optionId, pollId },
  });
  if (!option) return responseStatus(res, 404, "failed", "Poll option not found");
  const row = await prisma.ptaPollVote.upsert({
    where: { pollId_parentId: { pollId, parentId } },
    create: { pollId, parentId, optionId },
    update: { optionId },
  });
  return responseStatus(res, 200, "success", serializeForApi(row));
};

exports.listAnnouncementsService = async (query, res) => {
  const rows = await prisma.campusAnnouncement.findMany({
    where: query.campusId ? { campusId: query.campusId } : {},
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    take: 50,
  });
  return responseStatus(res, 200, "success", rows.map(serializeForApi));
};

exports.createAnnouncementService = async (data, res) => {
  const row = await prisma.campusAnnouncement.create({
    data: {
      campusId: data.campusId,
      title: data.title,
      body: data.body,
      category: data.category || "GENERAL",
      isPinned: !!data.isPinned,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });
  return responseStatus(res, 201, "success", serializeForApi(row));
};
