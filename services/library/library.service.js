const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");

exports.listBooksService = async (query, res) => {
  const { search, campusId } = query;
  const rows = await prisma.libraryBook.findMany({
    where: {
      ...(campusId && { campusId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { author: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    orderBy: { title: "asc" },
  });
  return responseStatus(res, 200, "success", rows.map(serializeForApi));
};

exports.createBookService = async (data, res) => {
  const copies = data.copies ?? 1;
  const row = await prisma.libraryBook.create({
    data: { ...data, copies, available: copies },
  });
  return responseStatus(res, 201, "success", serializeForApi(row));
};

exports.borrowBookService = async (data, res) => {
  const { bookId, studentId, dueAt } = data;
  const book = await prisma.libraryBook.findUnique({ where: { id: bookId } });
  if (!book || book.available < 1) {
    return responseStatus(res, 400, "failed", "Book not available");
  }
  const loan = await prisma.libraryLoan.create({
    data: {
      bookId,
      studentId,
      dueAt: new Date(dueAt || Date.now() + 14 * 86400000),
    },
  });
  await prisma.libraryBook.update({
    where: { id: bookId },
    data: { available: { decrement: 1 } },
  });
  return responseStatus(res, 201, "success", serializeForApi(loan));
};

exports.returnBookService = async (loanId, fineAmount, res) => {
  const loan = await prisma.libraryLoan.findUnique({ where: { id: loanId } });
  if (!loan) return responseStatus(res, 404, "failed", "Loan not found");
  if (loan.returnedAt) return responseStatus(res, 400, "failed", "Already returned");

  const updated = await prisma.libraryLoan.update({
    where: { id: loanId },
    data: { returnedAt: new Date(), fineAmount: fineAmount ?? 0 },
  });
  await prisma.libraryBook.update({
    where: { id: loan.bookId },
    data: { available: { increment: 1 } },
  });
  return responseStatus(res, 200, "success", serializeForApi(updated));
};

exports.listLoansService = async (query, res) => {
  const { studentId, active } = query;
  const rows = await prisma.libraryLoan.findMany({
    where: {
      ...(studentId && { studentId }),
      ...(active === "true" && { returnedAt: null }),
    },
    include: { book: true, student: true },
    orderBy: { borrowedAt: "desc" },
  });
  return responseStatus(
    res,
    200,
    "success",
    rows.map((r) => ({
      ...serializeForApi(r),
      bookTitle: r.book.title,
      studentName: r.student.name,
    }))
  );
};
