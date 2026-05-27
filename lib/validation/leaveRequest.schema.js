const { z } = require("zod");

const leaveRequestSchema = z.object({
  teacherId: z.string().uuid("teacherId must be a valid UUID"),
  startDate: z.string().min(1, "startDate is required"),
  endDate: z.string().min(1, "endDate is required"),
  reason: z.string().min(1, "reason is required"),
});

const reviewLeaveSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"], {
    errorMap: () => ({ message: "status must be APPROVED or REJECTED" }),
  }),
});

module.exports = { leaveRequestSchema, reviewLeaveSchema };
