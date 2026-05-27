const express = require("express");
const attendanceRouter = express.Router();
const protectedRoute = require("../../../middlewares/protectedRoute");
const {
  createAttendanceSessionController,
  upsertSessionRecordsController,
  listAttendanceSessionsController,
  getAttendanceSessionController,
  studentAttendanceHistoryController,
  classAttendanceSummaryController,
  importDoorLogController,
} = require("../../../controllers/attendance/attendance.controller");

const manageRecord = protectedRoute("attendance.record.manage");
const readReport = protectedRoute("attendance.report.read");

attendanceRouter.post(
  "/attendance/sessions",
  [...manageRecord],
  createAttendanceSessionController
);

attendanceRouter.put(
  "/attendance/sessions/:sessionId/records",
  [...manageRecord],
  upsertSessionRecordsController
);

attendanceRouter.get(
  "/attendance/sessions",
  [...readReport],
  listAttendanceSessionsController
);

attendanceRouter.get(
  "/attendance/sessions/:sessionId",
  [...readReport],
  getAttendanceSessionController
);

attendanceRouter.get(
  "/attendance/students/:studentId/history",
  [...readReport],
  studentAttendanceHistoryController
);

attendanceRouter.get(
  "/attendance/classes/:classLevelId/summary",
  [...readReport],
  classAttendanceSummaryController
);

attendanceRouter.post(
  "/attendance/door-imports",
  [...manageRecord],
  importDoorLogController
);

module.exports = attendanceRouter;
