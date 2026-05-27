const { z } = require("zod");

const payrollRunSchema = z.object({
  campusId: z.string().uuid("campusId must be a valid UUID"),
  periodLabel: z.string().min(1, "periodLabel is required"),
});

const payrollLineSchema = z.object({
  teacherId: z.string().uuid("teacherId must be a valid UUID"),
  baseSalary: z.coerce.number().nonnegative("baseSalary must be >= 0"),
  deductions: z.coerce.number().nonnegative().optional().default(0),
});

const approvePayrollSchema = z.object({
  status: z.enum(["APPROVED", "PAID"], {
    errorMap: () => ({ message: "status must be APPROVED or PAID" }),
  }),
});

module.exports = { payrollRunSchema, payrollLineSchema, approvePayrollSchema };
