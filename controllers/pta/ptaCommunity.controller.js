const responseStatus = require("../../handlers/responseStatus.handler");
const community = require("../../services/pta/ptaCommunity.service");

exports.listMeetingsController = async (req, res) => {
  try {
    await community.listMeetingsService(req.query, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.createMeetingController = async (req, res) => {
  try {
    await community.createMeetingService(
      { ...req.body, createdById: req.actor?.profileId },
      res
    );
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.rsvpMeetingController = async (req, res) => {
  try {
    await community.rsvpMeetingService(
      req.params.meetingId,
      req.parent.id,
      req.body.status,
      res
    );
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listPollsController = async (req, res) => {
  try {
    await community.listPollsService(req.query, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.createPollController = async (req, res) => {
  try {
    await community.createPollService(req.body, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.votePollController = async (req, res) => {
  try {
    await community.votePollService(
      req.params.pollId,
      req.parent.id,
      req.body.optionId,
      res
    );
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listAnnouncementsController = async (req, res) => {
  try {
    await community.listAnnouncementsService(req.query, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.createAnnouncementController = async (req, res) => {
  try {
    await community.createAnnouncementService(req.body, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};
