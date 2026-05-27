/**
 * Termii SMS / WhatsApp (Nigeria). Requires TERMII_API_KEY.
 */

const TERMII_BASE = "https://api.ng.termii.com";

function isConfigured() {
  return !!process.env.TERMII_API_KEY;
}

/**
 * @param {{ to: string; message: string; channel?: 'generic' | 'whatsapp' }}
 */
async function sendMessage({ to, message, channel = "generic" }) {
  const apiKey = process.env.TERMII_API_KEY;
  if (!apiKey) {
    return { demo: true, ok: true, message: "TERMII_API_KEY not set — logged only" };
  }

  const endpoint =
    channel === "whatsapp" ? "/api/whatsapp/send" : "/api/sms/send";

  const body =
    channel === "whatsapp"
      ? {
          api_key: apiKey,
          to,
          from: process.env.TERMII_WHATSAPP_DEVICE_ID || "schoolportal",
          type: "text",
          channel: "whatsapp",
          sms: message,
        }
      : {
          api_key: apiKey,
          to,
          from: process.env.TERMII_SENDER_ID || "SchoolPortal",
          sms: message,
          type: "plain",
          channel: "generic",
        };

  const res = await fetch(`${TERMII_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || `Termii error (${res.status})`);
  }

  return { demo: false, ok: true, data: json };
}

module.exports = { sendMessage, isConfigured };
