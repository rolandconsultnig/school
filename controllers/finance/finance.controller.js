const responseStatus = require("../../handlers/responseStatus.handler");
const {
  listFeeStructuresService,
  createFeeStructureService,
  assignStudentFeeService,
  listStudentFeesService,
  recordPaymentService,
  listDefaultersService,
  exportLedgerCsvService,
} = require("../../services/finance/finance.service");

exports.listFeeStructuresController = async (req, res) => {
  try {
    await listFeeStructuresService(req.query, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.createFeeStructureController = async (req, res) => {
  try {
    await createFeeStructureService(req.body, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.assignStudentFeeController = async (req, res) => {
  try {
    await assignStudentFeeService(req.body, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listStudentFeesController = async (req, res) => {
  try {
    await listStudentFeesService(req.query, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.recordPaymentController = async (req, res) => {
  try {
    await recordPaymentService(
      req.params.feeId,
      Number(req.body.amount),
      res
    );
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listDefaultersController = async (req, res) => {
  try {
    await listDefaultersService(res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.exportLedgerController = async (req, res) => {
  try {
    await exportLedgerCsvService(req.query, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};
