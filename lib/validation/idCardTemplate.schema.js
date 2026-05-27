const { z } = require("zod");

const idCardTemplateSchema = z.object({
  name: z.string().min(1, "name is required"),
  campusId: z.string().uuid().optional(),
  isDefault: z.boolean().optional(),
  layoutJson: z.union([z.string(), z.record(z.unknown())]).optional(),
});

const bulkIssueSchema = z.object({
  studentIds: z.array(z.string().uuid()).min(1, "studentIds required"),
  templateId: z.string().uuid().optional(),
});

module.exports = { idCardTemplateSchema, bulkIssueSchema };
