const responseStatus = require("../../handlers/responseStatus.handler");
const {
  studentCheckExamResultService,
  getAllExamResultsService,
} = require("../../services/academic/results.service");

exports.studentCheckExamResultController = async (req, res) => {
  try {
    await studentCheckExamResultService(
      req.params.examId,
      req.userAuth.id,
      res
    );
  } catch (error) {
    responseStatus(res, 400, "failed", error.message);
  }
};

exports.getAllExamResultsController = async (req, res) => {
  try {
    await getAllExamResultsService(
      req.params.classLevelId,
      req.userAuth.id,
      res
    );
  } catch (error) {
    responseStatus(res, 400, "failed", error.message);
  }
};
