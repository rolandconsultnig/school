const express = require("express");
const libraryRouter = express.Router();
const protectedRoute = require("../../../middlewares/protectedRoute");
const validateBody = require("../../../middlewares/validateBody");
const {
  createBookSchema,
  borrowBookSchema,
  returnBookSchema,
} = require("../../../lib/validation/library.schema");
const {
  listBooksController,
  createBookController,
  borrowBookController,
  returnBookController,
  listLoansController,
} = require("../../../controllers/library/library.controller");

const readCat = protectedRoute("library.catalog.read");
const manage = protectedRoute("library.catalog.manage");

libraryRouter.get("/library/books", [...readCat], listBooksController);
libraryRouter.post("/library/books", [...manage], validateBody(createBookSchema), createBookController);
libraryRouter.post("/library/loans", [...manage], validateBody(borrowBookSchema), borrowBookController);
libraryRouter.post(
  "/library/loans/:loanId/return",
  [...manage],
  validateBody(returnBookSchema),
  returnBookController
);
libraryRouter.get("/library/loans", [...readCat], listLoansController);

module.exports = libraryRouter;
