const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");
const {
  findTeacherConflicts,
  findClassConflicts,
} = require("../../lib/attendance/conflicts");

async function loadActiveSlots(filter) {
  return prisma.timetableSlot.findMany({
    where: { isActive: true, ...filter },
    include: { classLevel: true, subject: true, teacher: true },
  });
}

exports.createTimetableSlotService = async (data, res) => {
  const {
    campusId,
    tier,
    classLevelId,
    subjectId,
    teacherId,
    dayOfWeek,
    startMinutes,
    endMinutes,
    room,
    academicTermId,
  } = data;

  if (
    classLevelId == null ||
    teacherId == null ||
    dayOfWeek == null ||
    startMinutes == null ||
    endMinutes == null
  ) {
    return responseStatus(
      res,
      400,
      "failed",
      "classLevelId, teacherId, dayOfWeek, startMinutes, endMinutes are required"
    );
  }

  if (endMinutes <= startMinutes) {
    return responseStatus(res, 400, "failed", "endMinutes must be after startMinutes");
  }

  const peerFilter = {
    ...(campusId && { campusId }),
    dayOfWeek: Number(dayOfWeek),
  };

  const peers = await loadActiveSlots(peerFilter);
  const teacherHits = findTeacherConflicts(peers, {
    teacherId,
    dayOfWeek: Number(dayOfWeek),
    startMinutes,
    endMinutes,
  });
  const classHits = findClassConflicts(peers, {
    classLevelId,
    dayOfWeek: Number(dayOfWeek),
    startMinutes,
    endMinutes,
  });

  if (teacherHits.length || classHits.length) {
    return responseStatus(res, 409, "failed", {
      message: "Timetable conflict detected",
      teacherConflicts: teacherHits.map((s) => serializeForApi(s)),
      classConflicts: classHits.map((s) => serializeForApi(s)),
    });
  }

  const slot = await prisma.timetableSlot.create({
    data: {
      campusId,
      tier,
      classLevelId,
      subjectId,
      teacherId,
      dayOfWeek: Number(dayOfWeek),
      startMinutes,
      endMinutes,
      room,
      academicTermId,
    },
    include: { classLevel: true, subject: true, teacher: true },
  });

  return responseStatus(res, 201, "success", serializeForApi(slot));
};

exports.listTimetableSlotsService = async (query, res) => {
  const { classLevelId, teacherId, campusId, tier, dayOfWeek } = query;
  const slots = await prisma.timetableSlot.findMany({
    where: {
      isActive: true,
      ...(classLevelId && { classLevelId }),
      ...(teacherId && { teacherId }),
      ...(campusId && { campusId }),
      ...(tier && { tier }),
      ...(dayOfWeek != null && { dayOfWeek: Number(dayOfWeek) }),
    },
    include: { classLevel: true, subject: true, teacher: true },
    orderBy: [{ dayOfWeek: "asc" }, { startMinutes: "asc" }],
  });
  return responseStatus(
    res,
    200,
    "success",
    slots.map((s) => serializeForApi(s))
  );
};

exports.updateTimetableSlotService = async (slotId, data, res) => {
  const existing = await prisma.timetableSlot.findUnique({ where: { id: slotId } });
  if (!existing) return responseStatus(res, 404, "failed", "Timetable slot not found");

  const merged = { ...existing, ...data };
  const peers = await loadActiveSlots({
    ...(merged.campusId && { campusId: merged.campusId }),
    dayOfWeek: Number(merged.dayOfWeek),
  });

  const teacherHits = findTeacherConflicts(peers, {
    teacherId: merged.teacherId,
    dayOfWeek: Number(merged.dayOfWeek),
    startMinutes: merged.startMinutes,
    endMinutes: merged.endMinutes,
    excludeId: slotId,
  });
  const classHits = findClassConflicts(peers, {
    classLevelId: merged.classLevelId,
    dayOfWeek: Number(merged.dayOfWeek),
    startMinutes: merged.startMinutes,
    endMinutes: merged.endMinutes,
    excludeId: slotId,
  });

  if (teacherHits.length || classHits.length) {
    return responseStatus(res, 409, "failed", {
      message: "Timetable conflict detected",
      teacherConflicts: teacherHits.map((s) => serializeForApi(s)),
      classConflicts: classHits.map((s) => serializeForApi(s)),
    });
  }

  const slot = await prisma.timetableSlot.update({
    where: { id: slotId },
    data: {
      ...(data.campusId !== undefined && { campusId: data.campusId }),
      ...(data.tier !== undefined && { tier: data.tier }),
      ...(data.classLevelId && { classLevelId: data.classLevelId }),
      ...(data.subjectId !== undefined && { subjectId: data.subjectId }),
      ...(data.teacherId && { teacherId: data.teacherId }),
      ...(data.dayOfWeek != null && { dayOfWeek: Number(data.dayOfWeek) }),
      ...(data.startMinutes != null && { startMinutes: data.startMinutes }),
      ...(data.endMinutes != null && { endMinutes: data.endMinutes }),
      ...(data.room !== undefined && { room: data.room }),
      ...(data.academicTermId !== undefined && { academicTermId: data.academicTermId }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: { classLevel: true, subject: true, teacher: true },
  });

  return responseStatus(res, 200, "success", serializeForApi(slot));
};

exports.deleteTimetableSlotService = async (slotId, res) => {
  const slot = await prisma.timetableSlot.update({
    where: { id: slotId },
    data: { isActive: false },
  });
  return responseStatus(res, 200, "success", serializeForApi(slot));
};

exports.createSubstitutionService = async (data, createdById, res) => {
  const { timetableSlotId, substituteTeacherId, effectiveDate, reason } = data;
  if (!timetableSlotId || !substituteTeacherId || !effectiveDate) {
    return responseStatus(
      res,
      400,
      "failed",
      "timetableSlotId, substituteTeacherId, effectiveDate are required"
    );
  }

  const sub = await prisma.timetableSubstitution.upsert({
    where: {
      timetableSlotId_effectiveDate: {
        timetableSlotId,
        effectiveDate: new Date(effectiveDate),
      },
    },
    create: {
      timetableSlotId,
      substituteTeacherId,
      effectiveDate: new Date(effectiveDate),
      reason,
      createdById,
    },
    update: { substituteTeacherId, reason, createdById },
    include: {
      slot: { include: { classLevel: true, teacher: true } },
      substituteTeacher: true,
    },
  });

  return responseStatus(res, 201, "success", serializeForApi(sub));
};

exports.listSubstitutionsService = async (query, res) => {
  const { timetableSlotId, from, to } = query;
  const subs = await prisma.timetableSubstitution.findMany({
    where: {
      ...(timetableSlotId && { timetableSlotId }),
      ...(from || to
        ? {
            effectiveDate: {
              ...(from && { gte: new Date(from) }),
              ...(to && { lte: new Date(to) }),
            },
          }
        : {}),
    },
    include: {
      slot: { include: { classLevel: true } },
      substituteTeacher: true,
    },
    orderBy: { effectiveDate: "desc" },
  });
  return responseStatus(
    res,
    200,
    "success",
    subs.map((s) => serializeForApi(s))
  );
};

exports.checkConflictsService = async (query, res) => {
  const { teacherId, classLevelId, dayOfWeek, startMinutes, endMinutes, campusId } =
    query;

  const peers = await loadActiveSlots({
    ...(campusId && { campusId }),
    ...(dayOfWeek != null && { dayOfWeek: Number(dayOfWeek) }),
  });

  const result = {};
  if (teacherId && startMinutes && endMinutes) {
    result.teacherConflicts = findTeacherConflicts(peers, {
      teacherId,
      dayOfWeek: Number(dayOfWeek),
      startMinutes: Number(startMinutes),
      endMinutes: Number(endMinutes),
    }).map((s) => serializeForApi(s));
  }
  if (classLevelId && startMinutes && endMinutes) {
    result.classConflicts = findClassConflicts(peers, {
      classLevelId,
      dayOfWeek: Number(dayOfWeek),
      startMinutes: Number(startMinutes),
      endMinutes: Number(endMinutes),
    }).map((s) => serializeForApi(s));
  }

  return responseStatus(res, 200, "success", result);
};
