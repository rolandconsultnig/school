const { test } = require("node:test");
const assert = require("node:assert/strict");
const paystack = require("../lib/integrations/paystack");

test("paystack demo mode when secret key missing", () => {
  assert.equal(paystack.isLive(), !!process.env.PAYSTACK_SECRET_KEY);
});

test("paystack initialize returns demo authorization url without secret", async () => {
  const prev = process.env.PAYSTACK_SECRET_KEY;
  delete process.env.PAYSTACK_SECRET_KEY;
  try {
    const result = await paystack.initializeTransaction({
      email: "student@school.local",
      amount: 5000,
      reference: "SP-test-001",
      callbackUrl: "http://localhost:5345/paystack/callback",
    });
    assert.equal(result.demo, true);
    assert.ok(result.authorization_url.includes("SP-test-001"));
  } finally {
    if (prev) process.env.PAYSTACK_SECRET_KEY = prev;
  }
});
