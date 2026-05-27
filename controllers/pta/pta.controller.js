const responseStatus = require("../../handlers/responseStatus.handler");
const {
  sendMessageService,
  listMessagesForParentService,
  listMessagesForTeacherService,
  markMessageReadService,
} = require("../../services/pta/pta.service");

exports.sendPtaMessageController = async (req, res) => {
  try {
    const sender = req.parent
      ? { type: "parent", id: req.parent.id }
      : { type: "staff", id: req.actor.profileId };
    await sendMessageService(req.body, sender, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listParentMessagesController = async (req, res) => {
  try {
    const parentId = req.parent?.id || req.params.parentId;
    await listMessagesForParentService(parentId, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listTeacherMessagesController = async (req, res) => {
  try {
    const teacherId = req.actor?.profileId || req.params.teacherId;
    await listMessagesForTeacherService(teacherId, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.markPtaMessageReadController = async (req, res) => {
  try {
    await markMessageReadService(req.params.messageId, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};
