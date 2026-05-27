const prisma = require("../../lib/prisma");

/**
 * Queue a notification for the worker to deliver.
 */
async function queueNotification({
  channel,
  recipient,
  subject,
  body,
  campusId,
  scheduledAt,
  payload,
}) {
  return prisma.notificationQueue.create({
    data: {
      channel,
      recipient,
      subject,
      body,
      campusId,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      payload,
    },
  });
}

module.exports = { queueNotification };
