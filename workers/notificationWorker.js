/**
 * Processes pending NotificationQueue rows (Module 0).
 * Run: npm run worker:notifications
 */
require("dotenv").config({ override: true });
const prisma = require("../lib/prisma");

const BATCH_SIZE = Number(process.env.NOTIFICATION_BATCH_SIZE) || 20;
const POLL_MS = Number(process.env.NOTIFICATION_POLL_MS) || 5000;

async function deliver(item) {
  const bodyText = item.body || "";
  const line =
    `[notify] ${item.channel} → ${item.recipient}` +
    (item.subject ? ` | ${item.subject}` : "") +
    (bodyText ? `\n  ${String(bodyText).slice(0, 120)}` : "");

  if (
    (item.channel === "SMS" || item.channel === "WHATSAPP") &&
    process.env.TERMII_API_KEY
  ) {
    try {
      const termii = require("../lib/integrations/termii");
      await termii.sendMessage({
        to: item.recipient,
        message: bodyText || item.subject || "SchoolPortal",
        channel: item.channel === "WHATSAPP" ? "whatsapp" : "generic",
      });
      console.log(`${line}\n  → sent via Termii`);
      return { ok: true };
    } catch (err) {
      console.warn(`${line}\n  → Termii failed: ${err.message}`);
    }
  }

  if (item.channel === "EMAIL" && process.env.SMTP_HOST) {
    try {
      const nodemailer = require("nodemailer");
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
      await transport.sendMail({
        from: process.env.SMTP_FROM || "noreply@school.local",
        to: item.recipient,
        subject: item.subject || "SchoolPortal notification",
        text: bodyText || item.subject || "Notification",
      });
      console.log(`${line}\n  → sent via SMTP`);
      return { ok: true };
    } catch (err) {
      console.warn(`${line}\n  → SMTP failed: ${err.message}, logged only`);
    }
  }

  if (item.channel === "PUSH") {
    console.log(`${line}\n  → push logged (wire FCM/APNs in production)`);
    return { ok: true };
  }

  console.log(line);
  return { ok: true };
}

async function processBatch() {
  const now = new Date();
  const pending = await prisma.notificationQueue.findMany({
    where: {
      status: "PENDING",
      OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
    },
    take: BATCH_SIZE,
    orderBy: { createdAt: "asc" },
  });

  for (const item of pending) {
    try {
      await deliver(item);
      await prisma.notificationQueue.update({
        where: { id: item.id },
        data: { status: "SENT", sentAt: new Date(), error: null },
      });
    } catch (err) {
      await prisma.notificationQueue.update({
        where: { id: item.id },
        data: { status: "FAILED", error: err.message },
      });
    }
  }

  return pending.length;
}

async function run() {
  await prisma.$connect();
  console.log("Notification worker started");

  const loop = async () => {
    try {
      const n = await processBatch();
      if (n > 0) console.log(`Processed ${n} notification(s)`);
    } catch (e) {
      console.error("Worker error:", e.message);
    }
    setTimeout(loop, POLL_MS);
  };

  loop();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
