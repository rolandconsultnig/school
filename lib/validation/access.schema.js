const { z } = require("zod");

const lockdownSchema = z.object({
  campusId: z.string().uuid("campusId must be a valid UUID"),
  enabled: z.boolean(),
});

const accessScanSchema = z.object({
  gate: z.string().optional(),
  externalId: z.string().optional(),
  studentId: z.string().uuid().optional(),
  ruleId: z.string().uuid().optional(),
  campusId: z.string().uuid().optional(),
});

const accessRuleSchema = z.object({
  name: z.string().min(1, "name is required"),
  gate: z.string().optional(),
});

const routeGpsSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

module.exports = { lockdownSchema, accessScanSchema, accessRuleSchema, routeGpsSchema };
