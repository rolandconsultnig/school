const responseStatus = require("../../handlers/responseStatus.handler");
const { logFromRequest } = require("../../lib/audit/logFromRequest");
const {
  createCourseService,
  listCoursesService,
  getCourseService,
  updateCourseService,
  enrollStudentsService,
  listStudentCoursesService,
  getStudentCourseService,
} = require("../../services/lms/course.service");
const {
  createAssignmentService,
  listAssignmentsService,
  updateAssignmentService,
  submitAssignmentService,
  gradeSubmissionService,
  listSubmissionsService,
} = require("../../services/lms/assignment.service");
const {
  createLiveSessionService,
  listLiveSessionsService,
  deleteLiveSessionService,
} = require("../../services/lms/liveSession.service");
const {
  getCourseGradebookService,
  getStudentGradebookService,
} = require("../../services/lms/gradebook.service");

exports.createCourseController = async (req, res) => {
  try {
    await createCourseService(req.body, res);
    await logFromRequest(req, {
      action: "CREATE",
      entityType: "Course",
      after: req.body,
      module: 6,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listCoursesController = async (req, res) => {
  try {
    await listCoursesService(req.query, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.getCourseController = async (req, res) => {
  try {
    await getCourseService(req.params.courseId, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.updateCourseController = async (req, res) => {
  try {
    await updateCourseService(req.params.courseId, req.body, res);
    await logFromRequest(req, {
      action: "UPDATE",
      entityType: "Course",
      entityId: req.params.courseId,
      after: req.body,
      module: 6,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.enrollStudentsController = async (req, res) => {
  try {
    await enrollStudentsService(
      req.params.courseId,
      req.body.studentIds,
      res
    );
    await logFromRequest(req, {
      action: "UPDATE",
      entityType: "CourseEnrollment",
      entityId: req.params.courseId,
      after: req.body,
      module: 6,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listStudentCoursesController = async (req, res) => {
  try {
    await listStudentCoursesService(req.userAuth.id, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.getStudentCourseController = async (req, res) => {
  try {
    await getStudentCourseService(
      req.params.courseId,
      req.userAuth.id,
      res
    );
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.createAssignmentController = async (req, res) => {
  try {
    await createAssignmentService(req.params.courseId, req.body, res);
    await logFromRequest(req, {
      action: "CREATE",
      entityType: "Assignment",
      after: req.body,
      module: 6,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listAssignmentsController = async (req, res) => {
  try {
    await listAssignmentsService(req.params.courseId, req.query, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.updateAssignmentController = async (req, res) => {
  try {
    await updateAssignmentService(req.params.assignmentId, req.body, res);
    await logFromRequest(req, {
      action: "UPDATE",
      entityType: "Assignment",
      entityId: req.params.assignmentId,
      after: req.body,
      module: 6,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.submitAssignmentController = async (req, res) => {
  try {
    await submitAssignmentService(
      req.params.assignmentId,
      req.userAuth.id,
      req.body,
      res
    );
    await logFromRequest(req, {
      action: "UPDATE",
      entityType: "AssignmentSubmission",
      entityId: req.params.assignmentId,
      module: 6,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.gradeSubmissionController = async (req, res) => {
  try {
    await gradeSubmissionService(
      req.params.submissionId,
      req.body,
      req.actor.profileId,
      res
    );
    await logFromRequest(req, {
      action: "UPDATE",
      entityType: "AssignmentSubmission",
      entityId: req.params.submissionId,
      after: req.body,
      module: 6,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listSubmissionsController = async (req, res) => {
  try {
    await listSubmissionsService(req.params.assignmentId, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.createLiveSessionController = async (req, res) => {
  try {
    await createLiveSessionService(req.params.courseId, req.body, res);
    await logFromRequest(req, {
      action: "CREATE",
      entityType: "LiveClassSession",
      after: req.body,
      module: 6,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listLiveSessionsController = async (req, res) => {
  try {
    await listLiveSessionsService(req.params.courseId, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.deleteLiveSessionController = async (req, res) => {
  try {
    await deleteLiveSessionService(req.params.sessionId, res);
    await logFromRequest(req, {
      action: "DELETE",
      entityType: "LiveClassSession",
      entityId: req.params.sessionId,
      module: 6,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.getCourseGradebookController = async (req, res) => {
  try {
    await getCourseGradebookService(req.params.courseId, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.getStudentGradebookController = async (req, res) => {
  try {
    const studentId = req.params.studentId || req.userAuth.id;
    await getStudentGradebookService(studentId, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};
