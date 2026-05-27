const responseStatus = require("../../handlers/responseStatus.handler");
const { logFromRequest } = require("../../lib/audit/logFromRequest");
const {
  massAssignClassService,
  runPromotionService,
  getPromotionHistoryService,
} = require("../../services/sis/promotion.service");

exports.massAssignClassController = async (req, res) => {
  try {
    const { classLevelId, studentIds } = req.body;
    await massAssignClassService(classLevelId, studentIds, res);
    await logFromRequest(req, {
      action: "UPDATE",
      entityType: "ClassLevel",
      entityId: classLevelId,
      after: { studentIds },
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.runPromotionController = async (req, res) => {
  try {
    await runPromotionService(req.body, req.actor.profileId, res);
    await logFromRequest(req, {
      action: "UPDATE",
      entityType: "PromotionRun",
      after: req.body,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.getPromotionHistoryController = async (req, res) => {
  try {
    await getPromotionHistoryService(req.params.studentId, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};
