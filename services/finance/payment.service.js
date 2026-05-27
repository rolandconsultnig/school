const crypto = require("crypto");
const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");
const paystack = require("../../lib/integrations/paystack");
const { applyPaymentToFee } = require("./finance.service");

function makeReference() {
  return `SP-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
}

async function loadStudentFee(feeId, studentId) {
  const fee = await prisma.studentFee.findUnique({
    where: { id: feeId },
    include: { student: true, feeStructure: true },
  });
  if (!fee) return { error: "Fee record not found" };
  if (studentId && fee.studentId !== studentId) {
    return { error: "You can only pay your own fees" };
  }
  const balance = fee.amountDue - fee.amountPaid;
  if (balance <= 0) return { error: "This fee is already settled" };
  return { fee, balance };
}

exports.initializePaystackService = async (feeId, studentId, callbackUrl, res) => {
  const loaded = await loadStudentFee(feeId, studentId);
  if (loaded.error) return responseStatus(res, 400, "failed", loaded.error);

  const { fee, balance } = loaded;
  const reference = makeReference();

  await prisma.feePayment.create({
    data: {
      studentFeeId: feeId,
      amount: balance,
      provider: "PAYSTACK",
      reference,
      status: "PENDING",
      metadata: { studentId: fee.studentId, email: fee.student.email },
    },
  });

  const init = await paystack.initializeTransaction({
    email: fee.student.email,
    amount: balance,
    reference,
    callbackUrl,
    metadata: { studentFeeId: feeId, studentId: fee.studentId },
  });

  return responseStatus(res, 200, "success", {
    ...init,
    amount: balance,
    currency: "NGN",
    feeName: fee.feeStructure.name,
    studentFeeId: feeId,
  });
};

exports.verifyPaystackService = async (reference, res) => {
  const txn = await prisma.feePayment.findUnique({
    where: { reference },
    include: { studentFee: true },
  });
  if (!txn) return responseStatus(res, 404, "failed", "Payment reference not found");
  if (txn.status === "SUCCESS") {
    return responseStatus(res, 200, "success", {
      alreadyVerified: true,
      reference,
      studentFee: serializeForApi(txn.studentFee),
    });
  }

  const verified = await paystack.verifyTransaction(reference);
  if (verified.status !== "success") {
    await prisma.feePayment.update({
      where: { id: txn.id },
      data: { status: "FAILED", metadata: { verified } },
    });
    return responseStatus(res, 400, "failed", "Payment was not successful");
  }

  const amount = verified.demo ? txn.amount : verified.amount || txn.amount;

  await applyPaymentToFee(txn.studentFeeId, amount);

  await prisma.feePayment.update({
    where: { id: txn.id },
    data: {
      status: "SUCCESS",
      metadata: { verified },
    },
  });

  const updated = await prisma.studentFee.findUnique({
    where: { id: txn.studentFeeId },
    include: { feeStructure: true },
  });

  return responseStatus(res, 200, "success", {
    reference,
    amount,
    demo: !!verified.demo,
    studentFee: serializeForApi(updated),
  });
};

exports.paymentStatusService = async (res) => {
  return responseStatus(res, 200, "success", {
    paystack: {
      live: paystack.isLive(),
      publicKey: process.env.PAYSTACK_PUBLIC_KEY || null,
    },
    callbackUrl: process.env.PAYSTACK_CALLBACK_URL || null,
  });
};
