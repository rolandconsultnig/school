const { z } = require("zod");

const admissionInquirySchema = z.object({
  parentName: z.string().min(2, "parentName is required"),
  parentEmail: z.string().email("parentEmail must be valid"),
  parentPhone: z.string().optional(),
  studentName: z.string().min(1, "studentName is required"),
  message: z.string().optional(),
  tier: z.enum(["NURSERY", "PRIMARY", "SECONDARY"]).optional(),
  campusId: z.string().uuid().optional(),
});

module.exports = { admissionInquirySchema };
