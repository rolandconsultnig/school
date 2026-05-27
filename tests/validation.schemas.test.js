const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loginSchema } = require("../lib/validation/login.schema");
const { leaveRequestSchema, reviewLeaveSchema } = require("../lib/validation/leaveRequest.schema");
const { payrollRunSchema, approvePayrollSchema } = require("../lib/validation/payroll.schema");
const { lockdownSchema, routeGpsSchema } = require("../lib/validation/access.schema");
const { feeStructureSchema } = require("../lib/validation/finance.schema");
const { createBookSchema } = require("../lib/validation/library.schema");
const { createExamSchema } = require("../lib/validation/exam.schema");

test("login schema accepts valid credentials", () => {
  const r = loginSchema.safeParse({
    email: "admin@school.local",
    password: "secret",
  });
  assert.equal(r.success, true);
});

test("login schema rejects invalid email", () => {
  const r = loginSchema.safeParse({ email: "not-email", password: "x" });
  assert.equal(r.success, false);
});

test("leave request schema requires teacherId uuid", () => {
  const r = leaveRequestSchema.safeParse({
    teacherId: "not-uuid",
    startDate: "2026-05-01",
    endDate: "2026-05-05",
    reason: "Annual",
  });
  assert.equal(r.success, false);
});

test("review leave schema accepts APPROVED", () => {
  const r = reviewLeaveSchema.safeParse({ status: "APPROVED" });
  assert.equal(r.success, true);
});

test("payroll run schema requires campusId", () => {
  const r = payrollRunSchema.safeParse({ periodLabel: "May 2026" });
  assert.equal(r.success, false);
});

test("approve payroll schema rejects invalid status", () => {
  const r = approvePayrollSchema.safeParse({ status: "DRAFT" });
  assert.equal(r.success, false);
});

test("lockdown schema requires enabled boolean", () => {
  const r = lockdownSchema.safeParse({
    campusId: "550e8400-e29b-41d4-a716-446655440000",
    enabled: true,
  });
  assert.equal(r.success, true);
});

test("route gps schema validates coordinates", () => {
  const r = routeGpsSchema.safeParse({ latitude: 6.45, longitude: 3.4 });
  assert.equal(r.success, true);
});

test("fee structure schema requires positive amount", () => {
  const bad = feeStructureSchema.safeParse({ name: "Tuition", amount: 0 });
  assert.equal(bad.success, false);
  const ok = feeStructureSchema.safeParse({ name: "Tuition", amount: 50000 });
  assert.equal(ok.success, true);
});

test("library create book schema requires title", () => {
  assert.equal(createBookSchema.safeParse({}).success, false);
  assert.equal(createBookSchema.safeParse({ title: "Things Fall Apart" }).success, true);
});

test("create exam schema requires core fields", () => {
  const r = createExamSchema.safeParse({ name: "Midterm" });
  assert.equal(r.success, false);
});
