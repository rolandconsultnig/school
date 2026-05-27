import { request } from "./client";

function studentCtx(token: string) {
  return { token };
}

export type StudentDashboard = {
  greeting: { name: string; date: string; time: string };
  student: Record<string, unknown>;
  nextClass: {
    subject: string;
    teacher?: string;
    room: string;
    startTime: string;
    endTime: string;
    dayName: string;
    meetingUrl?: string | null;
    isNow?: boolean;
  } | null;
  notifications: { type: string; title: string; body: string; href?: string }[];
  idCard: { qrPayload: string; templateName?: string } | null;
  metrics: {
    attendancePercent: number | null;
    gpa: number | null;
    outstandingFees: number;
    currency: string;
  };
};

export const studentPortalApi = {
  dashboard: (token: string) =>
    request<StudentDashboard>("/students/portal/dashboard", studentCtx(token)),

  attendance: (token: string, from?: string, to?: string) => {
    const q = new URLSearchParams();
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    const qs = q.toString();
    return request<{ percent: number | null; calendar: { date: string; status: string }[] }>(
      `/students/portal/attendance${qs ? `?${qs}` : ""}`,
      studentCtx(token)
    );
  },

  fees: (token: string) =>
    request<{ fees: unknown[]; totalOutstanding: number; currency: string }>(
      "/students/portal/fees",
      studentCtx(token)
    ),

  initializePaystack: (token: string, feeId: string, callbackUrl?: string) =>
    request<{
      authorization_url: string;
      reference: string;
      amount: number;
      demo?: boolean;
    }>(`/students/portal/fees/${feeId}/payments/paystack/initialize`, {
      token,
      body: { callbackUrl },
    }),

  library: (token: string) =>
    request<{ activeLoans: unknown[]; history: unknown[]; totalFines: number }>(
      "/students/portal/library",
      studentCtx(token)
    ),

  libraryCatalog: (token: string, search?: string) => {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    return request<unknown[]>(`/students/portal/library/catalog${q}`, studentCtx(token));
  },

  accessLogs: (token: string) =>
    request<unknown[]>("/students/portal/access-logs", studentCtx(token)),

  announcements: (token: string) =>
    request<unknown[]>("/students/portal/announcements", studentCtx(token)),

  wallet: (token: string) =>
    request<{ balance: number; currency: string; transactions: unknown[] }>(
      "/students/portal/wallet",
      studentCtx(token)
    ),

  documentRequests: (token: string) =>
    request<unknown[]>("/students/portal/document-requests", studentCtx(token)),

  createDocumentRequest: (token: string, body: { type: string; notes?: string }) =>
    request<unknown>("/students/portal/document-requests", {
      token,
      body,
    }),

  feedback: (token: string, body: { category: string; body: string; isAnonymous?: boolean }) =>
    request<unknown>("/students/portal/feedback", { token, body }),

  messages: (token: string) =>
    request<unknown[]>("/students/portal/messages", studentCtx(token)),

  sendMessage: (token: string, body: { teacherId: string; subject?: string; body: string }) =>
    request<unknown>("/students/portal/messages", { token, body }),

  teachers: (token: string) =>
    request<unknown[]>("/students/portal/teachers", studentCtx(token)),

  transport: (token: string) =>
    request<{ routes: unknown[]; liveGps: unknown; note?: string }>(
      "/students/portal/transport",
      studentCtx(token)
    ),

  registration: (token: string) =>
    request<unknown[]>("/students/portal/registration", studentCtx(token)),

  assignments: (token: string) =>
    request<unknown[]>("/students/portal/assignments", studentCtx(token)),

  exams: (token: string) =>
    request<unknown[]>("/students/portal/exams", studentCtx(token)),

  studentCourse: (token: string, courseId: string) =>
    request<Record<string, unknown>>(`/lms/student/courses/${courseId}`, studentCtx(token)),

  submitAssignment: (
    token: string,
    assignmentId: string,
    body: { contentText?: string; contentUrl?: string }
  ) =>
    request<unknown>(`/lms/assignments/${assignmentId}/submit`, {
      token,
      body,
    }),
};
