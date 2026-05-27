const { z } = require("zod");

const createBookSchema = z.object({
  title: z.string().min(1),
  author: z.string().optional(),
  isbn: z.string().optional(),
  copies: z.coerce.number().int().min(1).optional(),
  campusId: z.string().uuid().optional(),
});

const borrowBookSchema = z.object({
  bookId: z.string().uuid(),
  studentId: z.string().uuid(),
  dueAt: z.string().optional(),
});

const returnBookSchema = z.object({
  fineAmount: z.coerce.number().min(0).optional(),
});

module.exports = { createBookSchema, borrowBookSchema, returnBookSchema };
