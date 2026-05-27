const { z } = require("zod");

const scheduleInterviewSchema = z.object({
  interviewDate: z.string().min(1, "interviewDate is required"),
});

const interviewScoreSchema = z.object({
  interviewScore: z.coerce.number().min(0).max(100),
  interviewNotes: z.string().optional(),
});

const applicantStatusSchema = z.object({
  status: z.enum([
    "APPLIED",
    "UNDER_REVIEW",
    "INTERVIEW_SCHEDULED",
    "ACCEPTED",
    "REJECTED",
    "ENROLLED",
  ]),
});

module.exports = {
  scheduleInterviewSchema,
  interviewScoreSchema,
  applicantStatusSchema,
};
