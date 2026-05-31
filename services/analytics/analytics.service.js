const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");

exports.getExecutiveDashboardService = async (query, res) => {
  const { campusId, tier } = query;

  const studentWhere = {
    ...(campusId && { campusId }),
    ...(tier && { tier }),
    isWithdrawn: false,
  };

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    students,
    teachers,
    applicants,
    inquiries,
    sessions,
    courses,
    overdueFees,
    pendingLeave,
    newStudents30d,
    payments30d,
    byTier,
  ] = await Promise.all([
    prisma.student.count({ where: studentWhere }),
    prisma.teacher.count({ where: { isWithdrawn: false } }),
    prisma.applicant.count({
      where: { status: { not: "ENROLLED" } },
    }),
    prisma.admissionInquiry.count(),
    prisma.attendanceSession.count({
      where: campusId ? { campusId } : {},
    }),
    prisma.course.count({
      where: {
        ...(campusId && { campusId }),
        ...(tier && { tier }),
      },
    }),
    prisma.studentFee.count({ where: { status: "OVERDUE" } }),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    prisma.student.count({
      where: { ...studentWhere, createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.feePayment.aggregate({
      where: { createdAt: { gte: thirtyDaysAgo }, status: "SUCCESS" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.student.groupBy({
      by: ["tier"],
      where: studentWhere,
      _count: true,
    }),
  ]);

  return responseStatus(res, 200, "success", {
    students,
    teachers,
    activeApplicants: applicants,
    admissionInquiries: inquiries,
    attendanceSessions: sessions,
    lmsCourses: courses,
    overdueFees,
    pendingLeaveRequests: pendingLeave,
    newStudentsLast30Days: newStudents30d,
    paymentsLast30Days: {
      count: payments30d._count,
      totalAmount: payments30d._sum.amount || 0,
    },
    studentsByTier: byTier.map((t) => ({
      tier: t.tier,
      count: t._count,
    })),
    generatedAt: new Date().toISOString(),
  });
};

exports.getEnrollmentTrendsService = async (query, res) => {
  const { campusId, tier } = query;
  const months = Math.min(Math.max(Number(query.months) || 6, 3), 12);

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const studentWhere = {
    ...(campusId && { campusId }),
    ...(tier && { tier }),
    isWithdrawn: false,
    createdAt: { gte: start },
  };

  const [students, payments, inquiries] = await Promise.all([
    prisma.student.findMany({
      where: studentWhere,
      select: { createdAt: true },
    }),
    prisma.feePayment.findMany({
      where: { status: "SUCCESS", createdAt: { gte: start } },
      select: { createdAt: true, amount: true },
    }),
    prisma.admissionInquiry.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true },
    }),
  ]);

  const bucketKey = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  const buckets = [];
  const byKey = {};
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
    const b = {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en-US", { month: "short" }),
      year: d.getFullYear(),
      newStudents: 0,
      payments: 0,
      inquiries: 0,
    };
    buckets.push(b);
    byKey[b.key] = b;
  }

  for (const s of students) {
    const b = byKey[bucketKey(s.createdAt)];
    if (b) b.newStudents += 1;
  }
  for (const p of payments) {
    const b = byKey[bucketKey(p.createdAt)];
    if (b) b.payments += Number(p.amount || 0);
  }
  for (const q of inquiries) {
    const b = byKey[bucketKey(q.createdAt)];
    if (b) b.inquiries += 1;
  }

  return responseStatus(res, 200, "success", {
    months: buckets,
    totals: {
      newStudents: buckets.reduce((s, b) => s + b.newStudents, 0),
      payments: buckets.reduce((s, b) => s + b.payments, 0),
      inquiries: buckets.reduce((s, b) => s + b.inquiries, 0),
    },
    generatedAt: new Date().toISOString(),
  });
};

exports.generateReportCardService = async (studentId, academicTermId, res) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { gradeLevel: true },
  });
  if (!student) return responseStatus(res, 404, "failed", "Student not found");

  const examResults = await prisma.examResult.findMany({
    where: {
      studentId,
      isPublished: true,
      ...(academicTermId && { academicTermId }),
    },
    include: { exam: true, subject: true },
  });

  const summary = {
    studentName: student.name,
    gradeLevel: student.gradeLevel?.name,
    exams: examResults.map((r) => ({
      exam: r.exam.name,
      subject: r.subject?.name,
      score: r.score,
      grade: r.grade,
      status: r.status,
    })),
    average:
      examResults.length > 0
        ? examResults.reduce((s, r) => s + r.score, 0) / examResults.length
        : null,
  };

  const card = await prisma.reportCard.create({
    data: {
      studentId,
      academicTermId,
      summaryJson: JSON.stringify(summary),
      isPublished: false,
    },
  });

  return responseStatus(res, 201, "success", { summary, reportCardId: card.id });
};

function renderReportCardHtml(summary) {
  const exams = summary.exams || [];
  const rows = exams
    .map(
      (e) =>
        `<tr><td>${e.exam ?? "—"}</td><td>${e.subject ?? "—"}</td><td>${e.score ?? "—"}</td><td>${e.grade ?? "—"}</td></tr>`
    )
    .join("");
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Report — ${summary.studentName ?? "Student"}</title>
<style>
  body{font-family:system-ui,sans-serif;margin:2rem;color:#0f172a}
  h1{margin:0 0 .25rem} table{width:100%;border-collapse:collapse;margin-top:1.5rem}
  th,td{border:1px solid #e2e8f0;padding:.5rem .75rem;text-align:left}
  th{background:#f8fafc}.avg{margin-top:1rem;font-weight:600}
  @media print{body{margin:1rem}}
</style></head><body>
<h1>Report card</h1>
<p><strong>${summary.studentName ?? ""}</strong> · ${summary.gradeLevel ?? "—"}</p>
<table><thead><tr><th>Exam</th><th>Subject</th><th>Score</th><th>Grade</th></tr></thead>
<tbody>${rows}</tbody></table>
<p class="avg">Average: ${summary.average != null ? summary.average.toFixed(1) : "—"}</p>
<script>window.onload=()=>window.print()</script>
</body></html>`;
}

exports.reportCardHtmlService = async (reportCardId, res) => {
  const card = await prisma.reportCard.findUnique({
    where: { id: reportCardId },
    include: { student: { include: { gradeLevel: true } } },
  });
  if (!card) return responseStatus(res, 404, "failed", "Report card not found");
  let summary = {};
  try {
    summary = JSON.parse(card.summaryJson || "{}");
  } catch {
    summary = {};
  }
  if (!summary.studentName && card.student) {
    summary.studentName = card.student.name;
    summary.gradeLevel = card.student.gradeLevel?.name;
  }
  res.type("html").send(renderReportCardHtml(summary));
};

exports.bulkGenerateReportCardsService = async (query, res) => {
  const { campusId, tier, classLevelId, limit } = query;
  const take = Math.min(Number(limit) || 50, 200);
  const students = await prisma.student.findMany({
    where: {
      isWithdrawn: false,
      ...(campusId && { campusId }),
      ...(tier && { tier }),
      ...(classLevelId && {
        classLevels: { some: { classLevelId } },
      }),
    },
    take,
    select: { id: true, name: true },
  });

  const created = [];
  for (const student of students) {
    const mockRes = {
      statusCode: 201,
      body: null,
      status(c) {
        this.statusCode = c;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };
    await exports.generateReportCardService(student.id, null, mockRes);
    if (mockRes.statusCode === 201 && mockRes.body?.data) {
      created.push({
        studentId: student.id,
        studentName: student.name,
        reportCardId: mockRes.body.data.reportCardId,
      });
    }
  }

  return responseStatus(res, 201, "success", {
    generated: created.length,
    reportCards: created,
  });
};

exports.listRecentReportCardsService = async (query, res) => {
  const { campusId, tier, limit } = query;
  const take = Math.min(Number(limit) || 30, 100);
  const cards = await prisma.reportCard.findMany({
    where: {
      ...(campusId && { student: { campusId } }),
      ...(tier && { student: { tier } }),
    },
    orderBy: { createdAt: "desc" },
    take,
    include: { student: { select: { id: true, name: true } } },
  });
  return responseStatus(
    res,
    200,
    "success",
    cards.map((c) => ({
      id: c.id,
      studentId: c.studentId,
      studentName: c.student?.name,
      isPublished: c.isPublished,
      createdAt: c.createdAt,
    }))
  );
};

exports.listReportCardsService = async (studentId, res) => {
  const cards = await prisma.reportCard.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
  });
  return responseStatus(
    res,
    200,
    "success",
    cards.map((c) => ({
      id: c.id,
      isPublished: c.isPublished,
      summary: JSON.parse(c.summaryJson || "{}"),
      createdAt: c.createdAt,
    }))
  );
};
