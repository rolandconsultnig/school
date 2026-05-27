const responseStatus = require("../../handlers/responseStatus.handler");
const {
  listTemplatesService,
  createTemplateService,
  issueStudentCardService,
  listStudentCardsService,
  bulkIssueService,
  listPrintQueueService,
  markPrintedService,
  previewCardService,
} = require("../../services/idcard/idcard.service");

exports.listTemplatesController = async (req, res) => {
  try {
    await listTemplatesService(res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.createTemplateController = async (req, res) => {
  try {
    await createTemplateService(req.body, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.issueStudentCardController = async (req, res) => {
  try {
    await issueStudentCardService(req.params.studentId, req.body.templateId, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.bulkIssueController = async (req, res) => {
  try {
    await bulkIssueService(req.body.studentIds, req.body.templateId, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.printQueueController = async (req, res) => {
  try {
    await listPrintQueueService(req.query.status, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.markPrintedController = async (req, res) => {
  try {
    await markPrintedService(req.params.cardId, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.previewCardController = async (req, res) => {
  try {
    await previewCardService(req.params.cardId, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listStudentCardsController = async (req, res) => {
  try {
    await listStudentCardsService(req.params.studentId, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};
