const express = require("express");
const timetableRouter = express.Router();
const protectedRoute = require("../../../middlewares/protectedRoute");
const {
  createTimetableSlotController,
  listTimetableSlotsController,
  updateTimetableSlotController,
  deleteTimetableSlotController,
  createSubstitutionController,
  listSubstitutionsController,
  checkConflictsController,
} = require("../../../controllers/attendance/timetable.controller");

const manageTimetable = protectedRoute("attendance.timetable.manage");

timetableRouter.post(
  "/attendance/timetable/slots",
  [...manageTimetable],
  createTimetableSlotController
);

timetableRouter.get(
  "/attendance/timetable/slots",
  [...manageTimetable],
  listTimetableSlotsController
);

timetableRouter.patch(
  "/attendance/timetable/slots/:slotId",
  [...manageTimetable],
  updateTimetableSlotController
);

timetableRouter.delete(
  "/attendance/timetable/slots/:slotId",
  [...manageTimetable],
  deleteTimetableSlotController
);

timetableRouter.get(
  "/attendance/timetable/conflicts",
  [...manageTimetable],
  checkConflictsController
);

timetableRouter.post(
  "/attendance/timetable/substitutions",
  [...manageTimetable],
  createSubstitutionController
);

timetableRouter.get(
  "/attendance/timetable/substitutions",
  [...manageTimetable],
  listSubstitutionsController
);

module.exports = timetableRouter;
