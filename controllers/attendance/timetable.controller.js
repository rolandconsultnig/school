const responseStatus = require("../../handlers/responseStatus.handler");
const { logFromRequest } = require("../../lib/audit/logFromRequest");
const {
  createTimetableSlotService,
  listTimetableSlotsService,
  updateTimetableSlotService,
  deleteTimetableSlotService,
  createSubstitutionService,
  listSubstitutionsService,
  checkConflictsService,
} = require("../../services/attendance/timetable.service");

exports.createTimetableSlotController = async (req, res) => {
  try {
    await createTimetableSlotService(req.body, res);
    await logFromRequest(req, {
      action: "CREATE",
      entityType: "TimetableSlot",
      after: req.body,
      module: 5,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listTimetableSlotsController = async (req, res) => {
  try {
    await listTimetableSlotsService(req.query, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.updateTimetableSlotController = async (req, res) => {
  try {
    await updateTimetableSlotService(req.params.slotId, req.body, res);
    await logFromRequest(req, {
      action: "UPDATE",
      entityType: "TimetableSlot",
      entityId: req.params.slotId,
      after: req.body,
      module: 5,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.deleteTimetableSlotController = async (req, res) => {
  try {
    await deleteTimetableSlotService(req.params.slotId, res);
    await logFromRequest(req, {
      action: "DELETE",
      entityType: "TimetableSlot",
      entityId: req.params.slotId,
      module: 5,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.createSubstitutionController = async (req, res) => {
  try {
    await createSubstitutionService(req.body, req.actor.profileId, res);
    await logFromRequest(req, {
      action: "CREATE",
      entityType: "TimetableSubstitution",
      after: req.body,
      module: 5,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listSubstitutionsController = async (req, res) => {
  try {
    await listSubstitutionsService(req.query, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.checkConflictsController = async (req, res) => {
  try {
    await checkConflictsService(req.query, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};
