import type { AuthUser, BootstrapData, SchoolTier } from "../types";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const API = `${API_BASE}/api/v1`;

/** Fetch HTML preview endpoints (ID cards, report cards) with auth headers. */
export async function fetchAuthenticatedHtml(
  path: string,
  token: string,
  campusId?: string | null,
  tier?: SchoolTier | null
): Promise<string> {
  const headers: Record<string, string> = { Accept: "text/html" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (campusId) headers["X-Campus-Id"] = campusId;
  if (tier) headers["X-Tier"] = tier;
  const res = await fetch(`${API}${path}`, { headers });
  if (!res.ok) throw new ApiError("Preview failed", res.status);
  return res.text();
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

type RequestOpts = {
  method?: string;
  body?: unknown;
  token?: string | null;
  campusId?: string | null;
  tier?: SchoolTier | null;
};

export async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.campusId) headers["X-Campus-Id"] = opts.campusId;
  if (opts.tier) headers["X-Tier"] = opts.tier;

  const res = await fetch(`${API}${path}`, {
    method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  if (json.status === "success") return json.data as T;
  const msg =
    typeof json.message === "string"
      ? json.message
      : json.message?.message ?? "Request failed";
  throw new ApiError(msg, res.status);
}

function ctx(token: string | null, campusId?: string | null, tier?: SchoolTier | null) {
  return { token, campusId, tier };
}

export async function uploadMultipart<T>(
  path: string,
  file: File,
  fields: Record<string, string>,
  token: string,
  campusId?: string | null,
  tier?: SchoolTier | null
): Promise<T> {
  const fd = new FormData();
  fd.append("file", file);
  for (const [k, v] of Object.entries(fields)) {
    fd.append(k, v);
  }
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  if (campusId) headers["X-Campus-Id"] = campusId;
  if (tier) headers["X-Tier"] = tier;
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers,
    body: fd,
  });
  const json = await res.json().catch(() => ({}));
  if (json.status === "success") return json.data as T;
  const msg =
    typeof json.message === "string"
      ? json.message
      : json.message?.message ?? "Upload failed";
  throw new ApiError(msg, res.status);
}

// ─── Auth ───
export const authApi = {
  login: (email: string, password: string) =>
    request<AuthUser>("/auth/login", { method: "POST", body: { email, password } }),
  ssoStatus: () =>
    request<{
      google: { enabled: boolean; authorizeUrl: string | null };
      microsoft: { enabled: boolean; authorizeUrl: string | null };
    }>("/auth/sso/status"),
  parentLogin: (email: string, password: string) =>
    request<{ parent: unknown; token: string }>("/parents/login", {
      method: "POST",
      body: { email, password },
    }),
  studentLogin: (email: string, password: string) =>
    request<{ student: unknown; token: string }>("/students/login", {
      method: "POST",
      body: { email, password },
    }),
};

// ─── Foundation ───
export const foundationApi = {
  bootstrap: (token: string) => request<BootstrapData>("/foundation/bootstrap", { token }),
  tiers: () => request<unknown>("/foundation/tiers"),
  gradesByTier: (tier: SchoolTier) =>
    request<unknown[]>(`/foundation/tiers/${tier}/grades`),
  auditLogs: (token: string, c?: string, t?: SchoolTier) =>
    request<unknown[]>("/foundation/audit-logs", ctx(token, c, t)),
};

// ─── Students ───
export const studentsApi = {
  list: (token: string, c?: string, t?: SchoolTier) =>
    request<unknown[]>("/admin/students", ctx(token, c, t)),
  get: (token: string, studentId: string, c?: string, t?: SchoolTier) =>
    request<unknown>(`/${studentId}/admin`, ctx(token, c, t)),
  register: (
    token: string,
    body: Record<string, unknown>,
    c?: string,
    t?: SchoolTier
  ) => request<unknown>("/students/admin/register", { ...ctx(token, c, t), body }),
  profile: (token: string) => request<unknown>("/students/profile", { token }),
};

// ─── SIS ───
export const sisApi = {
  profile360: (token: string, studentId: string, c?: string, t?: SchoolTier) =>
    request<unknown>(`/sis/students/${studentId}/profile`, ctx(token, c, t)),
  updateHealth: (token: string, studentId: string, body: unknown, c?: string, t?: SchoolTier) =>
    request<unknown>(`/sis/students/${studentId}/health`, {
      method: "PUT",
      ...ctx(token, c, t),
      body,
    }),
  addEmergencyContact: (
    token: string,
    studentId: string,
    body: { name: string; phone: string; relationship?: string },
    c?: string,
    t?: SchoolTier
  ) =>
    request<unknown>(`/sis/students/${studentId}/emergency-contacts`, {
      ...ctx(token, c, t),
      body,
    }),
  deleteDocument: (token: string, documentId: string, c?: string, t?: SchoolTier) =>
    request<unknown>(`/sis/documents/${documentId}`, {
      method: "DELETE",
      ...ctx(token, c, t),
    }),
  uploadDocument: (
    token: string,
    studentId: string,
    file: File,
    title: string,
    c?: string,
    t?: SchoolTier
  ) =>
    uploadMultipart<unknown>(
      `/sis/students/${studentId}/documents/upload`,
      file,
      { title },
      token,
      c,
      t
    ),
};

// ─── Classes ───
export const classesApi = {
  list: (token: string, c?: string, t?: SchoolTier) =>
    request<unknown[]>("/class-levels", ctx(token, c, t)),
  create: (token: string, body: unknown, c?: string, t?: SchoolTier) =>
    request<unknown>("/class-levels", { ...ctx(token, c, t), body }),
};

// ─── Teachers ───
export const teachersApi = {
  list: (token: string) => request<unknown[]>("/teachers", { token }),
  suspend: (token: string, id: string) =>
    request<unknown>(`/admins/suspend/teacher/${id}`, { method: "PUT", token }),
  unsuspend: (token: string, id: string) =>
    request<unknown>(`/admins/unsuspend/teacher/${id}`, { method: "PUT", token }),
  withdraw: (token: string, id: string) =>
    request<unknown>(`/admins/withdraw/teacher/${id}`, { method: "PUT", token }),
  unwithdraw: (token: string, id: string) =>
    request<unknown>(`/admins/unwithdraw/teacher/${id}`, { method: "PUT", token }),
};

// ─── Academic (legacy admin routes) ───
export const academicApi = {
  terms: (token: string) => request<unknown[]>("/academic-term", { token }),
  subjects: (token: string) => request<unknown[]>("/subject", { token }),
};

// ─── Admissions ───
export const admissionsApi = {
  inquiries: (token: string, c?: string, t?: SchoolTier) =>
    request<unknown[]>("/admissions/inquiries", ctx(token, c, t)),
  applicants: (token: string, c?: string, t?: SchoolTier) =>
    request<unknown[]>("/admissions/applicants", ctx(token, c, t)),
  createInquiry: (body: {
    parentName: string;
    parentEmail: string;
    parentPhone?: string;
    studentName: string;
    message?: string;
    tier?: SchoolTier;
    campusId?: string;
  }) => request<unknown>("/admissions/inquiries", { body }),
  registerApplicant: (body: Record<string, unknown>) =>
    request<{ applicant: unknown; token: string }>("/admissions/applicants/register", {
      body,
    }),
  applicantLogin: (email: string, password: string) =>
    request<{ applicant: unknown; token: string }>("/admissions/applicants/login", {
      method: "POST",
      body: { email, password },
    }),
  applicantPortal: (token: string) =>
    request<unknown>("/admissions/applicants/portal/me", { token }),
  applicantUploadDocument: (token: string, file: File, title: string) =>
    uploadMultipart<unknown>(
      "/admissions/applicants/portal/documents/upload",
      file,
      { title },
      token
    ),
};

// ─── Attendance ───
export const attendanceApi = {
  sessions: (token: string, query: Record<string, string>, c?: string, t?: SchoolTier) => {
    const q = new URLSearchParams(query).toString();
    return request<unknown[]>(`/attendance/sessions?${q}`, ctx(token, c, t));
  },
  createSession: (token: string, body: unknown, c?: string, t?: SchoolTier) =>
    request<unknown>("/attendance/sessions", { ...ctx(token, c, t), body }),
  updateRecords: (token: string, sessionId: string, records: unknown[], c?: string, t?: SchoolTier) =>
    request<unknown>(`/attendance/sessions/${sessionId}/records`, {
      method: "PUT",
      ...ctx(token, c, t),
      body: { records },
    }),
  slots: (token: string, query: Record<string, string>, c?: string, t?: SchoolTier) => {
    const q = new URLSearchParams(query).toString();
    return request<unknown[]>(`/attendance/timetable/slots?${q}`, ctx(token, c, t));
  },
  createSlot: (token: string, body: unknown, c?: string, t?: SchoolTier) =>
    request<unknown>("/attendance/timetable/slots", { ...ctx(token, c, t), body }),
  doorImport: (token: string, body: unknown, c?: string, t?: SchoolTier) =>
    request<unknown>("/attendance/door-imports", { ...ctx(token, c, t), body }),
  substitutions: (token: string, query: Record<string, string> = {}, c?: string, t?: SchoolTier) => {
    const q = new URLSearchParams(query).toString();
    return request<unknown[]>(`/attendance/timetable/substitutions?${q}`, ctx(token, c, t));
  },
  createSubstitution: (token: string, body: unknown, c?: string, t?: SchoolTier) =>
    request<unknown>("/attendance/timetable/substitutions", { ...ctx(token, c, t), body }),
  conflicts: (token: string, query: Record<string, string>, c?: string, t?: SchoolTier) => {
    const q = new URLSearchParams(query).toString();
    return request<unknown[]>(`/attendance/timetable/conflicts?${q}`, ctx(token, c, t));
  },
};

// ─── LMS ───
export const lmsApi = {
  courses: (token: string, c?: string, t?: SchoolTier) =>
    request<unknown[]>("/lms/courses", ctx(token, c, t)),
  course: (token: string, courseId: string, c?: string, t?: SchoolTier) =>
    request<unknown>(`/lms/courses/${courseId}`, ctx(token, c, t)),
  createCourse: (token: string, body: unknown, c?: string, t?: SchoolTier) =>
    request<unknown>("/lms/courses", { ...ctx(token, c, t), body }),
  gradebook: (token: string, courseId: string, c?: string, t?: SchoolTier) =>
    request<unknown>(`/lms/courses/${courseId}/gradebook`, ctx(token, c, t)),
  studentCourses: (token: string) => request<unknown[]>("/lms/student/courses", { token }),
  studentGradebook: (token: string) => request<unknown>("/lms/student/gradebook", { token }),
  createAssignment: (token: string, courseId: string, body: unknown, c?: string, t?: SchoolTier) =>
    request<unknown>(`/lms/courses/${courseId}/assignments`, {
      ...ctx(token, c, t),
      body,
    }),
};

// ─── SIS extended ───
export const sisExtendedApi = {
  assignClass: (
    token: string,
    body: { classLevelId: string; studentIds: string[] },
    campusId?: string | null,
    tier?: SchoolTier | null
  ) => request<unknown>("/sis/classes/assign", { ...ctx(token, campusId, tier), body }),
  runPromotion: (token: string, body: unknown, c?: string, t?: SchoolTier) =>
    request<unknown>("/sis/promotions/run", { ...ctx(token, c, t), body }),
};

// ─── Admissions actions ───
export const admissionsActionsApi = {
  updateStatus: (token: string, id: string, status: string, c?: string, t?: SchoolTier) =>
    request<unknown>(`/admissions/applicants/${id}/status`, {
      method: "PATCH",
      ...ctx(token, c, t),
      body: { status },
    }),
  enroll: (token: string, id: string, body: unknown, c?: string, t?: SchoolTier) =>
    request<unknown>(`/admissions/applicants/${id}/enroll`, {
      ...ctx(token, c, t),
      body,
    }),
  scheduleInterview: (token: string, id: string, interviewDate: string, c?: string, t?: SchoolTier) =>
    request<unknown>(`/admissions/applicants/${id}/interview/schedule`, {
      ...ctx(token, c, t),
      body: { interviewDate },
    }),
  recordInterviewScore: (
    token: string,
    id: string,
    body: { interviewScore: number; interviewNotes?: string },
    c?: string,
    t?: SchoolTier
  ) =>
    request<unknown>(`/admissions/applicants/${id}/interview/score`, {
      ...ctx(token, c, t),
      body,
    }),
};

// ─── Attendance session detail ───
export const attendanceDetailApi = {
  session: (token: string, sessionId: string, c?: string, t?: SchoolTier) =>
    request<unknown>(`/attendance/sessions/${sessionId}`, ctx(token, c, t)),
};

// ─── Analytics ───
export type ExecutiveDashboard = {
  students: number;
  teachers: number;
  activeApplicants: number;
  admissionInquiries: number;
  attendanceSessions: number;
  lmsCourses: number;
  overdueFees: number;
  pendingLeaveRequests: number;
  newStudentsLast30Days: number;
  paymentsLast30Days: { count: number; totalAmount: number };
  studentsByTier: { tier: string; count: number }[];
  generatedAt: string;
};

export type TrendPoint = {
  key: string;
  label: string;
  year: number;
  newStudents: number;
  payments: number;
  inquiries: number;
};

export type TrendsResponse = {
  months: TrendPoint[];
  totals: { newStudents: number; payments: number; inquiries: number };
  generatedAt: string;
};

export const analyticsApi = {
  executiveDashboard: (token: string, c?: string, t?: SchoolTier) =>
    request<ExecutiveDashboard>(
      "/analytics/executive-dashboard",
      ctx(token, c, t)
    ),
  trends: (token: string, months = 6, c?: string, t?: SchoolTier) =>
    request<TrendsResponse>(
      `/analytics/trends?months=${months}`,
      ctx(token, c, t)
    ),
  generateReportCard: (
    token: string,
    studentId: string,
    academicTermId?: string,
    c?: string,
    t?: SchoolTier
  ) =>
    request<unknown>(`/analytics/students/${studentId}/report-cards`, {
      ...ctx(token, c, t),
      body: { academicTermId },
    }),
  reportCards: (token: string, studentId: string, c?: string, t?: SchoolTier) =>
    request<unknown[]>(`/analytics/students/${studentId}/report-cards`, ctx(token, c, t)),
  reportCardHtml: (token: string, reportCardId: string, c?: string, t?: SchoolTier) =>
    fetchAuthenticatedHtml(
      `/analytics/report-cards/${reportCardId}/html`,
      token,
      c,
      t
    ),
  bulkGenerateReportCards: (token: string, body: unknown, c?: string, t?: SchoolTier) =>
    request<{ generated: number; reportCards: unknown[] }>(
      "/analytics/report-cards/bulk-generate",
      { ...ctx(token, c, t), body }
    ),
  recentReportCards: (token: string, query: Record<string, string>, c?: string, t?: SchoolTier) => {
    const q = new URLSearchParams(query).toString();
    return request<{ id: string; studentName?: string }[]>(
      `/analytics/report-cards?${q}`,
      ctx(token, c, t)
    );
  },
};

// ─── Finance ───
export const financeApi = {
  feeStructures: (token: string, c?: string, t?: SchoolTier) =>
    request<unknown[]>("/finance/fee-structures", ctx(token, c, t)),
  createFeeStructure: (token: string, body: unknown, c?: string, t?: SchoolTier) =>
    request<unknown>("/finance/fee-structures", { ...ctx(token, c, t), body }),
  studentFees: (token: string, query: Record<string, string>, c?: string, t?: SchoolTier) => {
    const q = new URLSearchParams(query).toString();
    return request<unknown[]>(`/finance/student-fees?${q}`, ctx(token, c, t));
  },
  assignFee: (token: string, body: unknown, c?: string, t?: SchoolTier) =>
    request<unknown>("/finance/student-fees", { ...ctx(token, c, t), body }),
  recordPayment: (token: string, feeId: string, amount: number, c?: string, t?: SchoolTier) =>
    request<unknown>(`/finance/student-fees/${feeId}/payments`, {
      ...ctx(token, c, t),
      body: { amount },
    }),
  defaulters: (token: string, c?: string, t?: SchoolTier) =>
    request<unknown[]>("/finance/defaulters", ctx(token, c, t)),
  paymentStatus: () =>
    request<{ paystack: { live: boolean; publicKey: string | null } }>(
      "/finance/payments/status"
    ),
  initializePaystack: (token: string, feeId: string, callbackUrl?: string) =>
    request<{
      authorization_url: string;
      reference: string;
      amount: number;
      demo?: boolean;
    }>(`/finance/student-fees/${feeId}/payments/paystack/initialize`, {
      token,
      body: { callbackUrl },
    }),
  verifyPaystack: (reference: string) =>
    request<unknown>(`/finance/payments/paystack/verify/${reference}`),
  exportLedger: async (token: string, query: Record<string, string> = {}, c?: string, t?: SchoolTier) => {
    const q = new URLSearchParams(query).toString();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (c) headers["X-Campus-Id"] = c;
    if (t) headers["X-Tier"] = t;
    const res = await fetch(`${API}/finance/ledger/export?${q}`, { headers });
    if (!res.ok) throw new ApiError("Export failed", res.status);
    return res.blob();
  },
};

// ─── HR ───
export const hrApi = {
  leaveRequests: (token: string, query: Record<string, string> = {}) => {
    const q = new URLSearchParams(query).toString();
    return request<unknown[]>(`/hr/leave-requests?${q}`, { token });
  },
  createLeave: (token: string, body: unknown) =>
    request<unknown>("/hr/leave-requests", { token, body }),
  reviewLeave: (token: string, id: string, body: unknown) =>
    request<unknown>(`/hr/leave-requests/${id}`, { method: "PATCH", token, body }),
  payrollRuns: (token: string, query: Record<string, string> = {}) => {
    const q = new URLSearchParams(query).toString();
    return request<unknown[]>(`/hr/payroll-runs?${q}`, { token });
  },
  createPayrollRun: (token: string, body: unknown) =>
    request<unknown>("/hr/payroll-runs", { token, body }),
  addPayrollLine: (token: string, runId: string, body: unknown) =>
    request<unknown>(`/hr/payroll-runs/${runId}/lines`, { token, body }),
  approvePayrollRun: (token: string, runId: string, status: string) =>
    request<unknown>(`/hr/payroll-runs/${runId}`, {
      method: "PATCH",
      token,
      body: { status },
    }),
  performanceReviews: (token: string, query: Record<string, string> = {}) => {
    const q = new URLSearchParams(query).toString();
    return request<unknown[]>(`/hr/performance-reviews?${q}`, { token });
  },
  createPerformanceReview: (token: string, body: unknown) =>
    request<unknown>("/hr/performance-reviews", { token, body }),
  updatePerformanceReview: (token: string, id: string, body: unknown) =>
    request<unknown>(`/hr/performance-reviews/${id}`, { method: "PATCH", token, body }),
};

// ─── Library ───
export const libraryApi = {
  books: (token: string, search?: string, c?: string, t?: SchoolTier) => {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    return request<unknown[]>(`/library/books${q}`, ctx(token, c, t));
  },
  createBook: (token: string, body: unknown, c?: string, t?: SchoolTier) =>
    request<unknown>("/library/books", { ...ctx(token, c, t), body }),
  loans: (token: string, query: Record<string, string> = {}, c?: string, t?: SchoolTier) => {
    const q = new URLSearchParams(query).toString();
    return request<unknown[]>(`/library/loans?${q}`, ctx(token, c, t));
  },
  borrow: (token: string, body: unknown, c?: string, t?: SchoolTier) =>
    request<unknown>("/library/loans", { ...ctx(token, c, t), body }),
  returnLoan: (token: string, loanId: string, c?: string, t?: SchoolTier) =>
    request<unknown>(`/library/loans/${loanId}/return`, {
      method: "POST",
      ...ctx(token, c, t),
      body: {},
    }),
};

// ─── ID cards ───
export const idcardApi = {
  templates: (token: string, c?: string, t?: SchoolTier) =>
    request<unknown[]>("/idcard/templates", ctx(token, c, t)),
  createTemplate: (token: string, body: unknown, c?: string, t?: SchoolTier) =>
    request<unknown>("/idcard/templates", { ...ctx(token, c, t), body }),
  printQueue: (token: string, status?: string, c?: string, t?: SchoolTier) => {
    const q = status ? `?status=${encodeURIComponent(status)}` : "";
    return request<unknown[]>(`/idcard/print-queue${q}`, ctx(token, c, t));
  },
  bulkIssue: (token: string, body: unknown, c?: string, t?: SchoolTier) =>
    request<unknown>("/idcard/bulk-issue", { ...ctx(token, c, t), body }),
  markPrinted: (token: string, cardId: string, c?: string, t?: SchoolTier) =>
    request<unknown>(`/idcard/cards/${cardId}/mark-printed`, {
      method: "PATCH",
      ...ctx(token, c, t),
      body: {},
    }),
  previewHtml: (token: string, cardId: string, c?: string, t?: SchoolTier) =>
    fetchAuthenticatedHtml(`/idcard/cards/${cardId}/preview`, token, c, t),
  issue: (token: string, studentId: string, templateId?: string, c?: string, t?: SchoolTier) =>
    request<unknown>(`/idcard/students/${studentId}/issue`, {
      ...ctx(token, c, t),
      body: { templateId },
    }),
  cards: (token: string, studentId: string, c?: string, t?: SchoolTier) =>
    request<unknown[]>(`/idcard/students/${studentId}/cards`, ctx(token, c, t)),
};

// ─── Access / IoT ───
export const accessApi = {
  scans: (token: string) => request<unknown[]>("/access/scans", { token }),
  recordScan: (token: string, body: unknown) =>
    request<unknown>("/access/scans", { token, body }),
  status: (token: string, campusId?: string) => {
    const q = campusId ? `?campusId=${encodeURIComponent(campusId)}` : "";
    return request<{ accessLockdown: boolean; campusId: string | null }>(
      `/access/status${q}`,
      { token }
    );
  },
  setLockdown: (token: string, campusId: string, enabled: boolean) =>
    request<unknown>("/access/lockdown", { token, body: { campusId, enabled } }),
  rules: (token: string) => request<unknown[]>("/access/rules", { token }),
  createRule: (token: string, body: unknown) =>
    request<unknown>("/access/rules", { token, body }),
};

// ─── Ancillary ───
export const ancillaryApi = {
  transportRoutes: (token: string, c?: string, t?: SchoolTier) =>
    request<unknown[]>("/ancillary/transport-routes", ctx(token, c, t)),
  createTransportRoute: (token: string, body: unknown, c?: string, t?: SchoolTier) =>
    request<unknown>("/ancillary/transport-routes", { ...ctx(token, c, t), body }),
  updateRouteGps: (token: string, routeId: string, body: unknown, c?: string, t?: SchoolTier) =>
    request<unknown>(`/ancillary/transport-routes/${routeId}/gps`, {
      ...ctx(token, c, t),
      body,
    }),
  cafeteriaMenus: (token: string, c?: string, t?: SchoolTier) =>
    request<unknown[]>("/ancillary/cafeteria-menus", ctx(token, c, t)),
  createCafeteriaMenu: (token: string, body: unknown, c?: string, t?: SchoolTier) =>
    request<unknown>("/ancillary/cafeteria-menus", { ...ctx(token, c, t), body }),
};

// ─── Exams (legacy) ───
export const examsApi = {
  list: (token: string, c?: string, t?: SchoolTier) =>
    request<unknown[]>("/exams", ctx(token, c, t)),
};

// ─── Parent / PTA ───
export const parentApi = {
  dashboard: (token: string) => request<unknown>("/parents/portal/dashboard", { token }),
  messages: (token: string) => request<unknown[]>("/pta/messages/parent/me", { token }),
  childSummary: (token: string, studentId: string) =>
    request<unknown>(`/parents/portal/children/${studentId}`, { token }),
};

export const ptaApi = {
  teacherMessages: (token: string) =>
    request<unknown[]>("/pta/messages/teacher/me", { token }),
  sendStaff: (token: string, body: unknown) =>
    request<unknown>("/pta/messages/staff", { token, body }),
  meetings: (token: string, query: Record<string, string> = {}) => {
    const q = new URLSearchParams(query).toString();
    return request<unknown[]>(`/pta/meetings?${q}`, { token });
  },
  createMeeting: (token: string, body: unknown) =>
    request<unknown>("/pta/meetings", { token, body }),
  rsvpMeeting: (token: string, meetingId: string, status: string) =>
    request<unknown>(`/pta/meetings/${meetingId}/rsvp`, { token, body: { status } }),
  polls: (token: string, query: Record<string, string> = {}) => {
    const q = new URLSearchParams(query).toString();
    return request<unknown[]>(`/pta/polls?${q}`, { token });
  },
  createPoll: (token: string, body: unknown) =>
    request<unknown>("/pta/polls", { token, body }),
  votePoll: (token: string, pollId: string, optionId: string) =>
    request<unknown>(`/pta/polls/${pollId}/vote`, { token, body: { optionId } }),
  announcements: (token: string, query: Record<string, string> = {}) => {
    const q = new URLSearchParams(query).toString();
    return request<unknown[]>(`/pta/announcements?${q}`, { token });
  },
  createAnnouncement: (token: string, body: unknown) =>
    request<unknown>("/pta/announcements", { token, body }),
};
