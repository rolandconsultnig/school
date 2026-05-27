/**
 * Paystack transaction helpers (Module 8).
 * Set PAYSTACK_SECRET_KEY for live mode; otherwise demo URLs are returned.
 */

const PAYSTACK_BASE = "https://api.paystack.co";

function isLive() {
  return !!process.env.PAYSTACK_SECRET_KEY;
}

async function paystackFetch(path, options = {}) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.status) {
    throw new Error(json.message || `Paystack error (${res.status})`);
  }
  return json.data;
}

/**
 * @param {{ email: string; amount: number; reference: string; callbackUrl?: string; metadata?: object }}
 */
async function initializeTransaction({ email, amount, reference, callbackUrl, metadata }) {
  if (!isLive()) {
    const base =
      callbackUrl ||
      process.env.PAYSTACK_CALLBACK_URL ||
      "http://localhost:5345/paystack/callback";
    const url = `${base}${base.includes("?") ? "&" : "?"}reference=${encodeURIComponent(reference)}`;
    return {
      demo: true,
      authorization_url: url,
      access_code: "demo",
      reference,
    };
  }

  const data = await paystackFetch("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100),
      reference,
      callback_url: callbackUrl || process.env.PAYSTACK_CALLBACK_URL,
      metadata,
    }),
  });

  return {
    demo: false,
    authorization_url: data.authorization_url,
    access_code: data.access_code,
    reference: data.reference,
  };
}

/**
 * @param {string} reference
 */
async function verifyTransaction(reference) {
  if (!isLive()) {
    return {
      demo: true,
      status: "success",
      reference,
      amount: 0,
      paid_at: new Date().toISOString(),
    };
  }

  const data = await paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`);
  return {
    demo: false,
    status: data.status,
    reference: data.reference,
    amount: (data.amount || 0) / 100,
    paid_at: data.paid_at,
    metadata: data.metadata,
  };
}

module.exports = { initializeTransaction, verifyTransaction, isLive };
