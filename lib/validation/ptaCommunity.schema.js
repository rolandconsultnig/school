const { z } = require("zod");

const ptaMeetingSchema = z.object({
  campusId: z.string().uuid().optional(),
  title: z.string().min(1),
  body: z.string().optional(),
  location: z.string().optional(),
  startsAt: z.string().min(1),
  endsAt: z.string().optional(),
});

const ptaPollSchema = z.object({
  campusId: z.string().uuid().optional(),
  question: z.string().min(1),
  closesAt: z.string().optional(),
  options: z.array(z.string().min(1)).min(2, "at least two options"),
});

const ptaAnnouncementSchema = z.object({
  campusId: z.string().uuid().optional(),
  title: z.string().min(1),
  body: z.string().min(1),
  category: z.string().optional(),
  isPinned: z.boolean().optional(),
  expiresAt: z.string().optional(),
});

module.exports = { ptaMeetingSchema, ptaPollSchema, ptaAnnouncementSchema };
