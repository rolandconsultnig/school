const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");

const VALID_STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];

exports.createAttendanceSessionService = async (data, takenById, res) => {
  const { classLevelId, sessionDate, campusId, tier, academicTermId, notes } = data;

  if (!classLevelId || !sessionDate) {
    return responseStatus(res, 400, "failed", "classLevelId and sessionDate are required");
  }

  const classLevel = await prisma.classLevel.findUnique({
    where: { id: classLevelId },
    include: { students: { include: { student: true } } },
  });
  if (!classLevel) return responseStatus(res, 404, "failed", "Class level not found");

  const date = new Date(sessionDate);
  let session;
  try {
    session = await prisma.attendanceSession.create({
      data: {
        classLevelId,
        sessionDate: date,
        campusId: campusId || classLevel.campusId,
        tier: tier || classLevel.tier,
        takenById,
        academicTermId,
        notes,
      },
    });
  } catch (e) {
    if (e.code === "P2002") {
      return responseStatus(res, 409, "failed", "Attendance already taken for this class on this date");
    }
    throw e;
  }

  const studentIds = classLevel.students.map((r) => r.studentId);
  if (studentIds.length) {
    await prisma.attendanceRecord.createMany({
      data: studentIds.map((studentId) => ({
        sessionId: session.id,
        studentId,
        status: "PRESENT",
      })),
      skipDuplicates: true,
    });
  }

  const full = await prisma.attendanceSession.findUnique({
    where: { id: session.id },
    include: {
      records: { include: { student: true } },
      classLevel: true,
    },
  });

  return responseStatus(res, 201, "success", serializeSession(full));
};

exports.upsertSessionRecordsService = async (sessionId, records, res) => {
  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
  });
  if (!session) return responseStatus(res, 404, "failed", "Session not found");

  const list = Array.isArray(records) ? records : [];
  for (const row of list) {
    if (!row.studentId || !VALID_STATUSES.includes(row.status)) continue;
    await prisma.attendanceRecord.upsert({
      where: {
        sessionId_studentId: { sessionId, studentId: row.studentId },
      },
      create: {
        sessionId,
        studentId: row.studentId,
        status: row.status,
        remark: row.remark,
      },
      update: { status: row.status, remark: row.remark },
    });
  }

  const updated = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: { records: { include: { student: true } }, classLevel: true },
  });

  return responseStatus(res, 200, "success", serializeSession(updated));
};

exports.listAttendanceSessionsService = async (query, res) => {
  const { classLevelId, from, to, campusId, tier } = query;
  const sessions = await prisma.attendanceSession.findMany({
    where: {
      ...(classLevelId && { classLevelId }),
      ...(campusId && { campusId }),
      ...(tier && { tier }),
      ...(from || to
        ? {
            sessionDate: {
              ...(from && { gte: new Date(from) }),
              ...(to && { lte: new Date(to) }),
            },
          }
        : {}),
    },
    include: {
      classLevel: true,
      records: true,
    },
    orderBy: { sessionDate: "desc" },
  });

  return responseStatus(
    res,
    200,
    "success",
    sessions.map((s) => ({
      ...serializeForApi(s),
      summary: summarizeRecords(s.records),
    }))
  );
};

exports.getAttendanceSessionService = async (sessionId, res) => {
  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: { records: { include: { student: true } }, classLevel: true },
  });
  if (!session) return responseStatus(res, 404, "failed", "Session not found");
  return responseStatus(res, 200, "success", serializeSession(session));
};

exports.studentAttendanceHistoryService = async (studentId, query, res) => {
  const { from, to } = query;
  const records = await prisma.attendanceRecord.findMany({
    where: {
      studentId,
      ...(from || to
        ? {
            session: {
              sessionDate: {
                ...(from && { gte: new Date(from) }),
                ...(to && { lte: new Date(to) }),
              },
            },
          }
        : {}),
    },
    include: {
      session: { include: { classLevel: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return responseStatus(
    res,
    200,
    "success",
    records.map((r) => ({
      ...serializeForApi(r),
      sessionDate: r.session.sessionDate,
      className: r.session.classLevel?.name,
    }))
  );
};

exports.classAttendanceSummaryService = async (classLevelId, query, res) => {
  const { from, to } = query;
  const sessions = await prisma.attendanceSession.findMany({
    where: {
      classLevelId,
      ...(from || to
        ? {
            sessionDate: {
              ...(from && { gte: new Date(from) }),
              ...(to && { lte: new Date(to) }),
            },
          }
        : {}),
    },
    include: { records: true },
    orderBy: { sessionDate: "asc" },
  });

  const byStudent = {};
  for (const session of sessions) {
    for (const rec of session.records) {
      if (!byStudent[rec.studentId]) {
        byStudent[rec.studentId] = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
      }
      byStudent[rec.studentId][rec.status]++;
    }
  }

  return responseStatus(res, 200, "success", {
    classLevelId,
    sessionCount: sessions.length,
    byStudent,
  });
};

exports.importDoorLogService = async (data, createdById, res) => {
  const { campusId, source, fileName, entries } = data;
  const list = Array.isArray(entries) ? entries : [];
  if (!list.length) {
    return responseStatus(res, 400, "failed", "entries array is required");
  }

  const imp = await prisma.attendanceDoorImport.create({
    data: {
      campusId,
      source: source || "door_scanner",
      fileName,
      rowCount: list.length,
      createdById,
    },
  });

  const created = [];
  for (const row of list) {
    let studentId = row.studentId;
    let matched = !!studentId;

    if (!studentId && row.externalId) {
      const student = await prisma.student.findFirst({
        where: {
          OR: [
            { studentId: row.externalId },
            { id: row.externalId },
          ],
        },
      });
      if (student) {
        studentId = student.id;
        matched = true;
      }
    }

    const entry = await prisma.attendanceDoorEntry.create({
      data: {
        importId: imp.id,
        studentId,
        externalId: row.externalId,
        scannedAt: new Date(row.scannedAt || Date.now()),
        gate: row.gate,
        matched,
      },
    });
    created.push(serializeForApi(entry));
  }

  return responseStatus(res, 201, "success", {
    import: serializeForApi(imp),
    entries: created,
    matched: created.filter((e) => e.matched).length,
  });
};

function summarizeRecords(records) {
  const summary = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0, total: records.length };
  for (const r of records) summary[r.status]++;
  return summary;
}

function serializeSession(session) {
  const data = serializeForApi(session);
  if (session.records) {
    data.records = session.records.map((r) => ({
      ...serializeForApi(r),
      studentName: r.student?.name,
    }));
    data.summary = summarizeRecords(session.records);
  }
  return data;
}
