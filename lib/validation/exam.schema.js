const { z } = require("zod");

const createExamSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  subject: z.string().uuid(),
  program: z.string().uuid(),
  academicTerm: z.string().uuid(),
  examTime: z.string().min(1),
  passMark: z.coerce.number().int().min(0).max(100).optional(),
  totalMark: z.coerce.number().int().positive().optional(),
  duration: z.string().optional(),
  examDate: z.string().optional(),
  classLevel: z.string().uuid().optional(),
  academicYear: z.string().uuid().optional(),
});

module.exports = { createExamSchema };
