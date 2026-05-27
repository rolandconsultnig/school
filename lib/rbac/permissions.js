const { MODULES } = require("../modules");

/**
 * Permission catalog: code → { module, resource, action, description }
 */
const PERMISSIONS = {
  // Module 0
  "system.organization.manage": {
    module: MODULES.INFRASTRUCTURE,
    resource: "organization",
    action: "manage",
    description: "Create and manage school organizations",
  },
  "system.campus.manage": {
    module: MODULES.INFRASTRUCTURE,
    resource: "campus",
    action: "manage",
    description: "Create and manage campuses",
  },
  "system.tier.read": {
    module: MODULES.INFRASTRUCTURE,
    resource: "tier",
    action: "read",
    description: "View school tiers and grade catalog",
  },
  "system.rbac.manage": {
    module: MODULES.INFRASTRUCTURE,
    resource: "rbac",
    action: "manage",
    description: "Manage roles and permission assignments",
  },
  "system.audit.read": {
    module: MODULES.INFRASTRUCTURE,
    resource: "audit",
    action: "read",
    description: "View audit trail logs",
  },
  "system.notification.send": {
    module: MODULES.INFRASTRUCTURE,
    resource: "notification",
    action: "send",
    description: "Queue SMS, email, WhatsApp, push notifications",
  },

  // Module 1 — Admissions
  "admissions.inquiry.manage": {
    module: MODULES.ADMISSIONS,
    resource: "inquiry",
    action: "manage",
    description: "Manage admission inquiries and CRM pipeline",
  },
  "admissions.applicant.review": {
    module: MODULES.ADMISSIONS,
    resource: "applicant",
    action: "review",
    description: "Review applicant documents and assessments",
  },
  "admissions.enrollment.execute": {
    module: MODULES.ADMISSIONS,
    resource: "enrollment",
    action: "execute",
    description: "Convert accepted applicants to active students",
  },

  // Module 2 — SIS
  "sis.student.read": {
    module: MODULES.SIS,
    resource: "student",
    action: "read",
    description: "View student profiles",
  },
  "sis.student.manage": {
    module: MODULES.SIS,
    resource: "student",
    action: "manage",
    description: "Create and update student records",
  },
  "sis.class.allocate": {
    module: MODULES.SIS,
    resource: "class",
    action: "allocate",
    description: "Assign students to classes and sections",
  },
  "sis.promotion.execute": {
    module: MODULES.SIS,
    resource: "promotion",
    action: "execute",
    description: "Run end-of-year promotions",
  },

  // Module 3–4
  "idcard.template.manage": {
    module: MODULES.ID_CARD,
    resource: "template",
    action: "manage",
    description: "Design ID card templates",
  },
  "access.rules.manage": {
    module: MODULES.IOT_ACCESS,
    resource: "rules",
    action: "manage",
    description: "Configure door access policies",
  },
  "access.monitor.read": {
    module: MODULES.IOT_ACCESS,
    resource: "monitor",
    action: "read",
    description: "View live access scan feed",
  },

  // Module 5
  "attendance.record.manage": {
    module: MODULES.ATTENDANCE,
    resource: "record",
    action: "manage",
    description: "Record and edit attendance",
  },
  "attendance.timetable.manage": {
    module: MODULES.ATTENDANCE,
    resource: "timetable",
    action: "manage",
    description: "Manage timetables and substitutions",
  },
  "attendance.report.read": {
    module: MODULES.ATTENDANCE,
    resource: "report",
    action: "read",
    description: "View attendance summaries and history",
  },

  // Module 6 — LMS (maps to existing exams)
  "lms.exam.manage": {
    module: MODULES.LMS,
    resource: "exam",
    action: "manage",
    description: "Create and manage exams and quizzes",
  },
  "lms.grade.read": {
    module: MODULES.LMS,
    resource: "grade",
    action: "read",
    description: "View grades and results",
  },
  "lms.grade.publish": {
    module: MODULES.LMS,
    resource: "grade",
    action: "publish",
    description: "Publish exam results",
  },
  "lms.course.manage": {
    module: MODULES.LMS,
    resource: "course",
    action: "manage",
    description: "Create and manage LMS courses",
  },
  "lms.assignment.manage": {
    module: MODULES.LMS,
    resource: "assignment",
    action: "manage",
    description: "Create assignments and grade submissions",
  },

  // Module 7–12 (stubs for seeding)
  "library.catalog.read": {
    module: MODULES.LIBRARY,
    resource: "catalog",
    action: "read",
    description: "Search library catalog",
  },
  "library.catalog.manage": {
    module: MODULES.LIBRARY,
    resource: "catalog",
    action: "manage",
    description: "Add books and manage loans",
  },
  "ancillary.services.manage": {
    module: MODULES.ANCILLARY,
    resource: "services",
    action: "manage",
    description: "Manage transport routes and cafeteria menus",
  },
  "finance.fee.manage": {
    module: MODULES.FINANCE,
    resource: "fee",
    action: "manage",
    description: "Manage fee structures and billing",
  },
  "hr.staff.manage": {
    module: MODULES.HR,
    resource: "staff",
    action: "manage",
    description: "Manage staff profiles and payroll",
  },
  "pta.message.send": {
    module: MODULES.PTA,
    resource: "message",
    action: "send",
    description: "Parent–teacher messaging",
  },
  "pta.community.manage": {
    module: MODULES.PTA,
    resource: "community",
    action: "manage",
    description: "PTA meetings, polls, and announcements",
  },
  "ancillary.transport.read": {
    module: MODULES.ANCILLARY,
    resource: "transport",
    action: "read",
    description: "View transport routes and GPS",
  },
  "analytics.dashboard.read": {
    module: MODULES.ANALYTICS,
    resource: "dashboard",
    action: "read",
    description: "View executive dashboards",
  },
};

/** Maps legacy JWT role strings to RBAC role codes */
const LEGACY_ROLE_MAP = {
  admin: "SCHOOL_ADMIN",
  teacher: "TEACHER",
  student: "STUDENT",
  parent: "PARENT",
};

/** Default permissions per role code */
const ROLE_PERMISSIONS = {
  SUPER_ADMIN: Object.keys(PERMISSIONS),
  SCHOOL_ADMIN: [
    "system.campus.manage",
    "system.tier.read",
    "system.audit.read",
    "system.notification.send",
    "admissions.inquiry.manage",
    "admissions.applicant.review",
    "admissions.enrollment.execute",
    "sis.student.read",
    "sis.student.manage",
    "sis.class.allocate",
    "sis.promotion.execute",
    "attendance.record.manage",
    "attendance.timetable.manage",
    "attendance.report.read",
    "lms.exam.manage",
    "lms.course.manage",
    "lms.assignment.manage",
    "lms.grade.read",
    "lms.grade.publish",
    "finance.fee.manage",
    "hr.staff.manage",
    "library.catalog.read",
    "library.catalog.manage",
    "idcard.template.manage",
    "access.rules.manage",
    "access.monitor.read",
    "ancillary.transport.read",
    "ancillary.services.manage",
    "analytics.dashboard.read",
    "pta.community.manage",
  ],
  ACADEMIC_HEAD: [
    "system.tier.read",
    "sis.student.read",
    "sis.class.allocate",
    "sis.promotion.execute",
    "attendance.record.manage",
    "attendance.report.read",
    "attendance.timetable.manage",
    "lms.exam.manage",
    "lms.course.manage",
    "lms.assignment.manage",
    "lms.grade.read",
    "lms.grade.publish",
    "analytics.dashboard.read",
  ],
  TEACHER: [
    "system.tier.read",
    "sis.student.read",
    "attendance.record.manage",
    "attendance.report.read",
    "lms.exam.manage",
    "lms.course.manage",
    "lms.assignment.manage",
    "lms.grade.read",
    "pta.message.send",
  ],
  ACCOUNTANT: ["finance.fee.manage", "analytics.dashboard.read"],
  STUDENT: ["system.tier.read", "lms.grade.read", "library.catalog.read"],
  PARENT: [
    "system.tier.read",
    "lms.grade.read",
    "pta.message.send",
    "ancillary.transport.read",
  ],
  LIBRARIAN: ["library.catalog.read", "library.catalog.manage"],
  REGISTRAR: [
    "admissions.inquiry.manage",
    "admissions.applicant.review",
    "admissions.enrollment.execute",
    "sis.student.manage",
  ],
  SECURITY_GUARD: ["access.monitor.read"],
};

const ROLES = [
  { code: "SUPER_ADMIN", name: "Super Admin", description: "Full system access across all campuses" },
  { code: "SCHOOL_ADMIN", name: "School Admin", description: "Campus-level administration" },
  { code: "ACADEMIC_HEAD", name: "Academic Head", description: "Academic operations lead" },
  { code: "TEACHER", name: "Teacher", description: "Classroom teacher" },
  { code: "ACCOUNTANT", name: "Accountant", description: "Finance and billing" },
  { code: "STUDENT", name: "Student", description: "Enrolled student" },
  { code: "PARENT", name: "Parent", description: "Parent or guardian" },
  { code: "LIBRARIAN", name: "Librarian", description: "Library operations" },
  { code: "REGISTRAR", name: "Registrar", description: "Admissions and records" },
  { code: "SECURITY_GUARD", name: "Security Guard", description: "Physical access monitoring" },
];

module.exports = {
  PERMISSIONS,
  LEGACY_ROLE_MAP,
  ROLE_PERMISSIONS,
  ROLES,
};
