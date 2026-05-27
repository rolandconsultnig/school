const express = require("express");
const sisRouter = express.Router();
const protectedRoute = require("../../../middlewares/protectedRoute");
const { upload } = require("../../../handlers/upload.middleware");
const {
  getStudent360Controller,
  upsertStudentHealthController,
  addEmergencyContactController,
  updateEmergencyContactController,
  deleteEmergencyContactController,
  addStudentDocumentController,
  listStudentDocumentsController,
  deleteStudentDocumentController,
} = require("../../../controllers/sis/sis.controller");

const readStudent = protectedRoute("sis.student.read");
const manageStudent = protectedRoute("sis.student.manage");

sisRouter.get(
  "/sis/students/:studentId/profile",
  [...readStudent],
  getStudent360Controller
);

sisRouter.put(
  "/sis/students/:studentId/health",
  [...manageStudent],
  upsertStudentHealthController
);

sisRouter.post(
  "/sis/students/:studentId/emergency-contacts",
  [...manageStudent],
  addEmergencyContactController
);

sisRouter.patch(
  "/sis/emergency-contacts/:contactId",
  [...manageStudent],
  updateEmergencyContactController
);

sisRouter.delete(
  "/sis/emergency-contacts/:contactId",
  [...manageStudent],
  deleteEmergencyContactController
);

sisRouter.get(
  "/sis/students/:studentId/documents",
  [...readStudent],
  listStudentDocumentsController
);

sisRouter.post(
  "/sis/students/:studentId/documents",
  [...manageStudent],
  addStudentDocumentController
);

sisRouter.post(
  "/sis/students/:studentId/documents/upload",
  [...manageStudent, upload.single("file")],
  addStudentDocumentController
);

sisRouter.delete(
  "/sis/documents/:documentId",
  [...manageStudent],
  deleteStudentDocumentController
);

module.exports = sisRouter;
