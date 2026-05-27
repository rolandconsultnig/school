const responseStatus = require("../../handlers/responseStatus.handler");
const {
  initializePaystackService,
  verifyPaystackService,
  paymentStatusService,
} = require("../../services/finance/payment.service");

exports.paymentStatusController = async (_req, res) => {
  try {
    await paymentStatusService(res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.initializePaystackController = async (req, res) => {
  try {
    await initializePaystackService(
      req.params.feeId,
      null,
      req.body.callbackUrl,
      res
    );
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.initializeStudentPaystackController = async (req, res) => {
  try {
    await initializePaystackService(
      req.params.feeId,
      req.userAuth.id,
      req.body.callbackUrl,
      res
    );
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.verifyPaystackController = async (req, res) => {
  try {
    await verifyPaystackService(req.params.reference, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};
