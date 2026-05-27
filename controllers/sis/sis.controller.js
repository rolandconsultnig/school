const responseStatus = require("../../handlers/responseStatus.handler");
const { logFromRequest } = require("../../lib/audit/logFromRequest");
const { publicFileUrl } = require("../../handlers/upload.middleware");
const {
  getStudent360Service,
  upsertStudentHealthService,
  addEmergencyContactService,
  updateEmergencyContactService,
  deleteEmergencyContactService,
  addStudentDocumentService,
  listStudentDocumentsService,
  deleteStudentDocumentService,
} = require("../../services/sis/sis.service");

exports.getStudent360Controller = async (req, res) => {
  try {
    await getStudent360Service(req.params.studentId, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.upsertStudentHealthController = async (req, res) => {
  try {
    await upsertStudentHealthService(req.params.studentId, req.body, res);
    await logFromRequest(req, {
      action: "UPDATE",
      entityType: "StudentHealth",
      entityId: req.params.studentId,
      after: req.body,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.addEmergencyContactController = async (req, res) => {
  try {
    await addEmergencyContactService(req.params.studentId, req.body, res);
    await logFromRequest(req, {
      action: "CREATE",
      entityType: "EmergencyContact",
      entityId: req.params.studentId,
      after: req.body,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.updateEmergencyContactController = async (req, res) => {
  try {
    await updateEmergencyContactService(req.params.contactId, req.body, res);
    await logFromRequest(req, {
      action: "UPDATE",
      entityType: "EmergencyContact",
      entityId: req.params.contactId,
      after: req.body,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.deleteEmergencyContactController = async (req, res) => {
  try {
    await deleteEmergencyContactService(req.params.contactId, res);
    await logFromRequest(req, {
      action: "DELETE",
      entityType: "EmergencyContact",
      entityId: req.params.contactId,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.addStudentDocumentController = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (req.file) {
      payload.fileUrl = await publicFileUrl(req, req.file.filename);
    }
    await addStudentDocumentService(
      req.params.studentId,
      payload,
      req.userAuth.id,
      res
    );
    await logFromRequest(req, {
      action: "CREATE",
      entityType: "StudentDocument",
      entityId: req.params.studentId,
      after: payload,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.listStudentDocumentsController = async (req, res) => {
  try {
    await listStudentDocumentsService(req.params.studentId, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.deleteStudentDocumentController = async (req, res) => {
  try {
    await deleteStudentDocumentService(req.params.documentId, res);
    await logFromRequest(req, {
      action: "DELETE",
      entityType: "StudentDocument",
      entityId: req.params.documentId,
    });
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};
