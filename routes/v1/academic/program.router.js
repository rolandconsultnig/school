const express = require("express");
const programRouter = express.Router();
// middleware
const protectedRoute = require("../../../middlewares/protectedRoute");
const manage = protectedRoute("lms.course.manage");
const {
  getProgramsController,
  createProgramController,
  getProgramController,
  updateProgramController,
  deleteProgramController,
} = require("../../../controllers/academic/program.controller");
// controllers
programRouter
  .route("/programs")
  .get([...manage], getProgramsController)
  .post([...manage], createProgramController);
programRouter
  .route("/programs/:id")
  .get([...manage], getProgramController)
  .patch([...manage], updateProgramController)
  .delete([...manage], deleteProgramController);

module.exports = programRouter;
