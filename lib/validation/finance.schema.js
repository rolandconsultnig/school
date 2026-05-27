const { z } = require("zod");

const schoolTier = z.enum(["NURSERY", "PRIMARY", "SECONDARY"]);

const feeStructureSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  amount: z.coerce.number().positive(),
  currency: z.string().min(3).max(3).optional(),
  tier: schoolTier.optional(),
  campusId: z.string().uuid().optional(),
  academicTermId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});

const assignStudentFeeSchema = z.object({
  studentId: z.string().uuid(),
  feeStructureId: z.string().uuid(),
  dueDate: z.string().optional(),
});

const recordPaymentSchema = z.object({
  amount: z.coerce.number().positive(),
});

module.exports = {
  feeStructureSchema,
  assignStudentFeeSchema,
  recordPaymentSchema,
};
