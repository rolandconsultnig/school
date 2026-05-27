const express = require("express");
const idcardRouter = express.Router();
const protectedRoute = require("../../../middlewares/protectedRoute");
const validateBody = require("../../../middlewares/validateBody");
const { idCardTemplateSchema, bulkIssueSchema } = require("../../../lib/validation/idCardTemplate.schema");
const {
  listTemplatesController,
  createTemplateController,
  issueStudentCardController,
  listStudentCardsController,
  bulkIssueController,
  printQueueController,
  markPrintedController,
  previewCardController,
} = require("../../../controllers/idcard/idcard.controller");

const manage = protectedRoute("idcard.template.manage");

idcardRouter.get("/idcard/templates", [...manage], listTemplatesController);
idcardRouter.post("/idcard/templates", [...manage], validateBody(idCardTemplateSchema), createTemplateController);
idcardRouter.get("/idcard/print-queue", [...manage], printQueueController);
idcardRouter.post("/idcard/bulk-issue", [...manage], validateBody(bulkIssueSchema), bulkIssueController);
idcardRouter.get("/idcard/cards/:cardId/preview", [...manage], previewCardController);
idcardRouter.patch("/idcard/cards/:cardId/mark-printed", [...manage], markPrintedController);
idcardRouter.post("/idcard/students/:studentId/issue", [...manage], issueStudentCardController);
idcardRouter.get("/idcard/students/:studentId/cards", [...manage], listStudentCardsController);

module.exports = idcardRouter;
