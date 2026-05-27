const responseStatus = require("../../handlers/responseStatus.handler");
const { logFromRequest } = require("../../lib/audit/logFromRequest");
const {
  createAttendanceSessionService,
  upsertSessionRecordsService,
  listAttendanceSessionsService,
  getAttendanceSessionService,
  studentAttendanceHistoryService,
  classAttendanceSummaryService,
  importDoorLogService,
} = require("../../services/attendance/attendance.service");

exports.createAttendanceSessionController = async (req, res) => {
  try {
    await createAttendanceSessionService(req.body, req.actor.profileId, res);
    await logFromRequest(req, {
      action: "CREATE",
      entityType: "AttendanceSession",
      after: req.body,
      module: 5,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.upsertSessionRecordsController = async (req, res) => {
  try {
    await upsertSessionRecordsService(
      req.params.sessionId,
      req.body.records,
      res
    );
    await logFromRequest(req, {
      action: "UPDATE",
      entityType: "AttendanceSession",
      entityId: req.params.sessionId,
      after: req.body,
      module: 5,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listAttendanceSessionsController = async (req, res) => {
  try {
    await listAttendanceSessionsService(req.query, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.getAttendanceSessionController = async (req, res) => {
  try {
    await getAttendanceSessionService(req.params.sessionId, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.studentAttendanceHistoryController = async (req, res) => {
  try {
    await studentAttendanceHistoryService(req.params.studentId, req.query, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.classAttendanceSummaryController = async (req, res) => {
  try {
    await classAttendanceSummaryService(req.params.classLevelId, req.query, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.importDoorLogController = async (req, res) => {
  try {
    await importDoorLogService(req.body, req.actor.profileId, res);
    await logFromRequest(req, {
      action: "CREATE",
      entityType: "AttendanceDoorImport",
      after: { rowCount: req.body.entries?.length },
      module: 5,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};
