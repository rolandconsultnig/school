const responseStatus = require("../../handlers/responseStatus.handler");
const {
  listBooksService,
  createBookService,
  borrowBookService,
  returnBookService,
  listLoansService,
} = require("../../services/library/library.service");

exports.listBooksController = async (req, res) => {
  try {
    await listBooksService(req.query, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.createBookController = async (req, res) => {
  try {
    await createBookService(req.body, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.borrowBookController = async (req, res) => {
  try {
    await borrowBookService(req.body, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.returnBookController = async (req, res) => {
  try {
    await returnBookService(req.params.loanId, req.body.fineAmount, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listLoansController = async (req, res) => {
  try {
    await listLoansService(req.query, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};
