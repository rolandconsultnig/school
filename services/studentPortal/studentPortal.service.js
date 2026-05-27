const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function minutesNow() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

function formatMinutes(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(min).padStart(2, "0")} ${ampm}`;
}

async function getClassLevelId(studentId) {
  const link = await prisma.studentClassLevel.findFirst({
    where: { studentId },
    orderBy: { classLevelId: "asc" },
  });
  return link?.classLevelId;
}

async function computeAttendancePercent(studentId) {
  const records = await prisma.attendanceRecord.findMany({
    where: { studentId },
    select: { status: true },
  });
  if (!records.length) return null;
  const present = records.filter((r) => r.status === "PRESENT").length;
  return Math.round((present / records.length) * 1000) / 10;
}

async function computeGpa(studentId) {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { studentId, course: { isPublished: true } },
    include: {
      course: {
        include: {
          assignments: {
            where: { isPublished: true },
            include: { submissions: { where: { studentId } } },
          },
        },
      },
    },
  });
  const examResults = await prisma.examResult.findMany({
    where: { studentId, isPublished: true },
  });

  const percents = [];
  for (const e of enrollments) {
    for (const a of e.course.assignments) {
      const sub = a.submissions[0];
      if (sub?.score != null && a.maxScore) {
        percents.push((sub.score / a.maxScore) * 100);
      }
    }
  }
  for (const r of examResults) {
    if (r.score != null) percents.push(r.score);
  }
  if (!percents.length) return null;
  return Math.round((percents.reduce((a, b) => a + b, 0) / percents.length) * 10) / 10;
}

exports.getDashboardService = async (studentId, res) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { gradeLevel: true, campus: true },
  });
  if (!student) return responseStatus(res, 404, "failed", "Student not found");

  const classLevelId = await getClassLevelId(studentId);
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mins = minutesNow();

  let nextClass = null;
  if (classLevelId) {
    const slots = await prisma.timetableSlot.findMany({
      where: { classLevelId, isActive: true, dayOfWeek },
      include: { subject: true, teacher: true },
      orderBy: { startMinutes: "asc" },
    });
    const upcoming =
      slots.find((s) => s.startMinutes > mins) ||
      slots.find((s) => s.endMinutes > mins) ||
      slots[0];
    if (upcoming) {
      const live = await prisma.liveClassSession.findFirst({
        where: {
          course: { classLevelId, teacherId: upcoming.teacherId },
          scheduledAt: { gte: new Date(now.toDateString()) },
        },
        orderBy: { scheduledAt: "asc" },
      });
      nextClass = {
        subject: upcoming.subject?.name ?? "Class",
        teacher: upcoming.teacher?.name,
        room: upcoming.room ?? "TBA",
        startTime: formatMinutes(upcoming.startMinutes),
        endTime: formatMinutes(upcoming.endMinutes),
        dayName: DAY_NAMES[dayOfWeek],
        meetingUrl: live?.meetingUrl ?? null,
        isNow: upcoming.startMinutes <= mins && upcoming.endMinutes > mins,
      };
    }
  }

  const in48h = new Date(Date.now() + 48 * 3600000);
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { studentId },
    select: { courseId: true },
  });
  const courseIds = enrollments.map((e) => e.courseId);

  const dueAssignments = await prisma.assignment.findMany({
    where: {
      courseId: { in: courseIds },
      isPublished: true,
      dueAt: { lte: in48h, gte: new Date() },
    },
    include: { course: true, submissions: { where: { studentId } } },
    orderBy: { dueAt: "asc" },
    take: 10,
  });

  const recentGrades = await prisma.assignmentSubmission.findMany({
    where: {
      studentId,
      score: { not: null },
      gradedAt: { gte: new Date(Date.now() - 7 * 86400000) },
    },
    include: { assignment: { include: { course: true } } },
    orderBy: { gradedAt: "desc" },
    take: 5,
  });

  const notifications = [];
  for (const a of dueAssignments) {
    const sub = a.submissions[0];
    if (!sub || sub.status === "PENDING") {
      notifications.push({
        type: "DEADLINE",
        title: `Due: ${a.title}`,
        body: `${a.course.title} — ${a.dueAt?.toISOString().slice(0, 16) ?? "soon"}`,
        href: `/learn/assignments`,
      });
    }
  }
  for (const g of recentGrades) {
    notifications.push({
      type: "GRADE",
      title: `Grade posted: ${g.assignment.title}`,
      body: `Score ${g.score}/${g.assignment.maxScore} in ${g.assignment.course.title}`,
      href: `/learn/gradebook`,
    });
  }

  const idCard = await prisma.studentIdCard.findFirst({
    where: { studentId },
    orderBy: { issuedAt: "desc" },
    include: { template: true },
  });

  const fees = await prisma.studentFee.findMany({
    where: {
      studentId,
      status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
    },
  });
  const outstandingFees = fees.reduce(
    (s, f) => s + (f.amountDue - f.amountPaid),
    0
  );

  const attendancePercent = await computeAttendancePercent(studentId);
  const gpa = await computeGpa(studentId);

  return responseStatus(res, 200, "success", {
    greeting: {
      name: student.name,
      date: now.toLocaleDateString("en-NG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: now.toLocaleTimeString("en-NG", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
    student: {
      ...serializeForApi(student),
      rollNumber: student.studentId,
      gradeLevel: student.gradeLevel?.name,
      campus: student.campus?.name,
    },
    nextClass,
    notifications,
    idCard: idCard
      ? {
          ...serializeForApi(idCard),
          qrPayload: idCard.qrPayload,
          templateName: idCard.template.name,
        }
      : null,
    metrics: {
      attendancePercent,
      gpa,
      outstandingFees,
      currency: "NGN",
    },
  });
};

exports.getMyAttendanceService = async (studentId, query, res) => {
  const { from, to } = query;
  const records = await prisma.attendanceRecord.findMany({
    where: {
      studentId,
      ...(from || to
        ? {
            session: {
              sessionDate: {
                ...(from && { gte: new Date(from) }),
                ...(to && { lte: new Date(to) }),
              },
            },
          }
        : {}),
    },
    include: { session: true },
    orderBy: { session: { sessionDate: "desc" } },
  });

  const calendar = records.map((r) => ({
    date: r.session.sessionDate.toISOString().slice(0, 10),
    status: r.status,
    remark: r.remark,
  }));

  const percent = await computeAttendancePercent(studentId);

  return responseStatus(res, 200, "success", { percent, calendar });
};

exports.getMyFeesService = async (studentId, res) => {
  const rows = await prisma.studentFee.findMany({
    where: { studentId },
    include: { feeStructure: true },
    orderBy: { createdAt: "desc" },
  });
  const totalDue = rows.reduce((s, r) => s + (r.amountDue - r.amountPaid), 0);
  return responseStatus(res, 200, "success", {
    fees: rows.map((r) => ({
      ...serializeForApi(r),
      feeName: r.feeStructure.name,
      balance: r.amountDue - r.amountPaid,
    })),
    totalOutstanding: totalDue,
    currency: "NGN",
  });
};

exports.searchLibraryCatalogService = async (studentId, query, res) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { campusId: true },
  });
  const { search } = query;
  const books = await prisma.libraryBook.findMany({
    where: {
      ...(student?.campusId && { campusId: student.campusId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { author: { contains: search, mode: "insensitive" } },
        ],
      }),
      available: { gt: 0 },
    },
    take: 30,
    orderBy: { title: "asc" },
  });
  return responseStatus(res, 200, "success", books.map(serializeForApi));
};

exports.getMyLibraryService = async (studentId, res) => {
  const loans = await prisma.libraryLoan.findMany({
    where: { studentId },
    include: { book: true },
    orderBy: { borrowedAt: "desc" },
  });
  const active = loans.filter((l) => !l.returnedAt);
  const fines = active.reduce((s, l) => s + (l.fineAmount ?? 0), 0);
  return responseStatus(res, 200, "success", {
    activeLoans: active.map((l) => ({
      ...serializeForApi(l),
      bookTitle: l.book.title,
      dueAt: l.dueAt,
    })),
    history: loans.map((l) => ({
      ...serializeForApi(l),
      bookTitle: l.book.title,
    })),
    totalFines: fines,
  });
};

exports.getMyAccessLogsService = async (studentId, res) => {
  const scans = await prisma.accessScan.findMany({
    where: { studentId },
    orderBy: { scannedAt: "desc" },
    take: 100,
  });
  return responseStatus(res, 200, "success", scans.map(serializeForApi));
};

exports.getAnnouncementsService = async (studentId, res) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { campusId: true },
  });
  const now = new Date();
  const rows = await prisma.campusAnnouncement.findMany({
    where: {
      AND: [
        { OR: [{ campusId: null }, { campusId: student?.campusId ?? undefined }] },
        { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
      ],
    },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    take: 50,
  });
  return responseStatus(res, 200, "success", rows.map(serializeForApi));
};

exports.getWalletService = async (studentId, res) => {
  let wallet = await prisma.studentCampusWallet.findUnique({
    where: { studentId },
  });
  if (!wallet) {
    wallet = await prisma.studentCampusWallet.create({
      data: { studentId, balance: 0 },
    });
  }
  const transactions = await prisma.walletTransaction.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return responseStatus(res, 200, "success", {
    ...serializeForApi(wallet),
    transactions: transactions.map(serializeForApi),
  });
};

exports.createDocumentRequestService = async (studentId, data, res) => {
  const { type, notes } = data;
  if (!type) return responseStatus(res, 400, "failed", "type is required");
  const row = await prisma.studentDocumentRequest.create({
    data: { studentId, type, notes },
  });
  return responseStatus(res, 201, "success", serializeForApi(row));
};

exports.listDocumentRequestsService = async (studentId, res) => {
  const rows = await prisma.studentDocumentRequest.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
  });
  return responseStatus(res, 200, "success", rows.map(serializeForApi));
};

exports.submitFeedbackService = async (studentId, data, res) => {
  const { category, body, isAnonymous } = data;
  if (!body?.trim()) return responseStatus(res, 400, "failed", "body is required");
  const row = await prisma.studentFeedback.create({
    data: {
      studentId: isAnonymous ? null : studentId,
      category: category || "SUGGESTION",
      body,
      isAnonymous: !!isAnonymous,
    },
  });
  return responseStatus(res, 201, "success", serializeForApi(row));
};

exports.sendMessageService = async (studentId, data, res) => {
  const { teacherId, subject, body } = data;
  if (!teacherId || !body?.trim()) {
    return responseStatus(res, 400, "failed", "teacherId and body are required");
  }
  const row = await prisma.studentMessage.create({
    data: { studentId, teacherId, subject, body },
    include: { teacher: true },
  });
  return responseStatus(res, 201, "success", {
    ...serializeForApi(row),
    teacherName: row.teacher.name,
  });
};

exports.listMyMessagesService = async (studentId, res) => {
  const rows = await prisma.studentMessage.findMany({
    where: { studentId },
    include: { teacher: true },
    orderBy: { createdAt: "desc" },
  });
  return responseStatus(
    res,
    200,
    "success",
    rows.map((r) => ({
      ...serializeForApi(r),
      teacherName: r.teacher.name,
    }))
  );
};

exports.getTransportService = async (studentId, res) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { campusId: true },
  });
  const routes = await prisma.transportRoute.findMany({
    where: student?.campusId ? { campusId: student.campusId } : {},
    orderBy: { name: "asc" },
  });
  const withGps = routes.find(
    (r) => r.lastLatitude != null && r.lastLongitude != null
  );
  return responseStatus(res, 200, "success", {
    routes: routes.map(serializeForApi),
    liveGps: withGps
      ? {
          routeId: withGps.id,
          routeName: withGps.name,
          latitude: withGps.lastLatitude,
          longitude: withGps.lastLongitude,
          updatedAt: withGps.lastGpsAt,
        }
      : null,
    note: withGps
      ? "Live position from the school bus tracker."
      : "GPS position will appear when the route is updated.",
  });
};

exports.getRegistrationCatalogService = async (studentId, res) => {
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    include: {
      subject: true,
      teacher: true,
      classLevel: true,
      _count: { select: { enrollments: true } },
    },
    take: 30,
  });
  const enrolled = await prisma.courseEnrollment.findMany({
    where: { studentId },
    select: { courseId: true },
  });
  const enrolledSet = new Set(enrolled.map((e) => e.courseId));
  return responseStatus(
    res,
    200,
    "success",
    courses.map((c) => ({
      ...serializeForApi(c),
      teacherName: c.teacher.name,
      enrolledCount: c._count.enrollments,
      isEnrolled: enrolledSet.has(c.id),
      seatsAvailable: 40 - c._count.enrollments,
    }))
  );
};

exports.listMyTeachersService = async (studentId, res) => {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { studentId, course: { isPublished: true } },
    include: { course: { include: { teacher: true } } },
  });
  const seen = new Set();
  const teachers = [];
  for (const e of enrollments) {
    const t = e.course.teacher;
    if (t && !seen.has(t.id)) {
      seen.add(t.id);
      teachers.push(serializeForApi(t));
    }
  }
  return responseStatus(res, 200, "success", teachers);
};

exports.listMyExamsService = async (studentId, res) => {
  const results = await prisma.examResult.findMany({
    where: { studentId },
    include: { exam: true, subject: true },
    orderBy: { createdAt: "desc" },
  });
  const published = results.filter((r) => r.isPublished);
  return responseStatus(
    res,
    200,
    "success",
    published.map((r) => ({
      ...serializeForApi(r),
      examName: r.exam.name,
      subjectName: r.subject?.name,
    }))
  );
};

exports.listUpcomingAssignmentsService = async (studentId, res) => {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { studentId },
    select: { courseId: true },
  });
  const courseIds = enrollments.map((e) => e.courseId);
  const assignments = await prisma.assignment.findMany({
    where: { courseId: { in: courseIds }, isPublished: true },
    include: {
      course: true,
      submissions: { where: { studentId } },
    },
    orderBy: { dueAt: "asc" },
  });
  return responseStatus(
    res,
    200,
    "success",
    assignments.map((a) => {
      const sub = a.submissions[0];
      return {
        ...serializeForApi(a),
        courseTitle: a.course.title,
        submission: sub ? serializeForApi(sub) : null,
        status: sub?.status ?? "PENDING",
        score: sub?.score ?? null,
      };
    })
  );
};
