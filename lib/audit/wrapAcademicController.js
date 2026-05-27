const { logFromRequest } = require("./logFromRequest");

/**
 * Wraps an academic controller to log audit after successful response.
 */
function wrapAcademicController(controller, entityType, action) {
  return async (req, res) => {
    const originalJson = res.json.bind(res);
    let capturedBody;

    res.json = function (body) {
      capturedBody = body;
      return originalJson(body);
    };

    try {
      await controller(req, res);
      if (capturedBody?.status === "success" && req.actor) {
        const entityId =
          capturedBody?.data?.id ||
          capturedBody?.data?._id ||
          req.params.id ||
          req.params.examId ||
          req.params.programId;
        await logFromRequest(req, {
          action,
          entityType,
          entityId,
          after: capturedBody.data,
        });
      }
    } catch (error) {
      throw error;
    }
  };
}

module.exports = wrapAcademicController;
