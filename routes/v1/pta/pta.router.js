const express = require("express");
const ptaRouter = express.Router();
const isLoggedIn = require("../../../middlewares/isLoggedIn");
const isParent = require("../../../middlewares/isParent");
const attachActor = require("../../../middlewares/attachActor");
const protectedRoute = require("../../../middlewares/protectedRoute");
const requirePermission = require("../../../middlewares/requirePermission");
const {
  sendPtaMessageController,
  listParentMessagesController,
  listTeacherMessagesController,
  markPtaMessageReadController,
} = require("../../../controllers/pta/pta.controller");
const validateBody = require("../../../middlewares/validateBody");
const {
  ptaMeetingSchema,
  ptaPollSchema,
  ptaAnnouncementSchema,
} = require("../../../lib/validation/ptaCommunity.schema");
const {
  listMeetingsController,
  createMeetingController,
  rsvpMeetingController,
  listPollsController,
  createPollController,
  votePollController,
  listAnnouncementsController,
  createAnnouncementController,
} = require("../../../controllers/pta/ptaCommunity.controller");

const ptaSend = protectedRoute("pta.message.send");
const ptaCommunity = protectedRoute("pta.community.manage");
const parentAuth = [isLoggedIn, isParent];

ptaRouter.post("/pta/messages", parentAuth, sendPtaMessageController);
ptaRouter.post("/pta/messages/staff", [...ptaSend], sendPtaMessageController);
ptaRouter.get("/pta/messages/parent/me", parentAuth, listParentMessagesController);
ptaRouter.get(
  "/pta/messages/teacher/me",
  [isLoggedIn, attachActor, requirePermission("pta.message.send")],
  listTeacherMessagesController
);
ptaRouter.patch(
  "/pta/messages/:messageId/read",
  [isLoggedIn, attachActor],
  markPtaMessageReadController
);

ptaRouter.get("/pta/meetings", [isLoggedIn, attachActor], listMeetingsController);
ptaRouter.post("/pta/meetings", [...ptaCommunity], validateBody(ptaMeetingSchema), createMeetingController);
ptaRouter.post("/pta/meetings/:meetingId/rsvp", parentAuth, rsvpMeetingController);

ptaRouter.get("/pta/polls", [isLoggedIn, attachActor], listPollsController);
ptaRouter.post("/pta/polls", [...ptaCommunity], validateBody(ptaPollSchema), createPollController);
ptaRouter.post("/pta/polls/:pollId/vote", parentAuth, votePollController);

ptaRouter.get("/pta/announcements", [isLoggedIn, attachActor], listAnnouncementsController);
ptaRouter.post(
  "/pta/announcements",
  [...ptaCommunity],
  validateBody(ptaAnnouncementSchema),
  createAnnouncementController
);

module.exports = ptaRouter;
