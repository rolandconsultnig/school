const responseStatus = require("../../handlers/responseStatus.handler");
const {
  getExecutiveDashboardService,
  generateReportCardService,
  listReportCardsService,
  listRecentReportCardsService,
  reportCardHtmlService,
  bulkGenerateReportCardsService,
} = require("../../services/analytics/analytics.service");

exports.getExecutiveDashboardController = async (req, res) => {
  try {
    await getExecutiveDashboardService(req.query, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.generateReportCardController = async (req, res) => {
  try {
    await generateReportCardService(
      req.params.studentId,
      req.body.academicTermId,
      res
    );
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listReportCardsController = async (req, res) => {
  try {
    await listReportCardsService(req.params.studentId, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listRecentReportCardsController = async (req, res) => {
  try {
    await listRecentReportCardsService(req.query, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.reportCardHtmlController = async (req, res) => {
  try {
    await reportCardHtmlService(req.params.reportCardId, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.bulkGenerateReportCardsController = async (req, res) => {
  try {
    await bulkGenerateReportCardsService({ ...req.query, ...req.body }, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};
