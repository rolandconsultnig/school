const { z } = require("zod");

const performanceReviewSchema = z.object({
  teacherId: z.string().uuid(),
  periodLabel: z.string().min(1),
  rating: z.coerce.number().min(1).max(5).optional(),
  comments: z.string().optional(),
});

const updatePerformanceSchema = z.object({
  rating: z.coerce.number().min(1).max(5).optional(),
  comments: z.string().optional(),
  status: z.enum(["DRAFT", "SUBMITTED", "ACKNOWLEDGED"]).optional(),
});

module.exports = { performanceReviewSchema, updatePerformanceSchema };
