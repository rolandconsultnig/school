const { test } = require("node:test");
const assert = require("node:assert/strict");
const { admissionInquirySchema } = require("../lib/validation/admissionInquiry.schema");

test("admission inquiry schema accepts valid payload", () => {
  const result = admissionInquirySchema.safeParse({
    parentName: "Ada Okafor",
    parentEmail: "ada@example.com",
    studentName: "Chidi Okafor",
    tier: "PRIMARY",
  });
  assert.equal(result.success, true);
});

test("admission inquiry schema rejects missing parentEmail", () => {
  const result = admissionInquirySchema.safeParse({
    parentName: "Ada Okafor",
    studentName: "Chidi",
  });
  assert.equal(result.success, false);
});
