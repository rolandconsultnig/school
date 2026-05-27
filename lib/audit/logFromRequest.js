const { createAuditLog } = require("./createAuditLog");

const ENTITY_MODULES = {
  AcademicTerm: 2,
  AcademicYear: 2,
  ClassLevel: 2,
  Program: 2,
  Subject: 6,
  YearGroup: 2,
  Exam: 6,
  Question: 6,
  ExamResult: 6,
  StudentHealth: 2,
  EmergencyContact: 2,
  StudentDocument: 2,
  AdmissionInquiry: 1,
  Applicant: 1,
  ApplicantDocument: 1,
  TimetableSlot: 5,
  TimetableSubstitution: 5,
  AttendanceSession: 5,
  AttendanceRecord: 5,
  AttendanceDoorImport: 5,
  Course: 6,
  Assignment: 6,
  AssignmentSubmission: 6,
  LiveClassSession: 6,
};

async function logFromRequest(
  req,
  { action, entityType, entityId, before, after, module }
) {
  if (!req?.actor) return null;

  return createAuditLog({
    actor: req.actor,
    action,
    entityType,
    entityId,
    module: module ?? ENTITY_MODULES[entityType] ?? 0,
    campusId: req.tenant?.campusId,
    tier: req.tenant?.tier,
    before,
    after,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });
}

module.exports = { logFromRequest, ENTITY_MODULES };
