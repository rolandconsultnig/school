const express = require("express");
const classRouter = express.Router();
const protectedRoute = require("../../../middlewares/protectedRoute");
const {
  getClassLevelsController,
  createClassLevelController,
  getClassLevelController,
  updateClassLevelController,
  deleteClassLevelController,
} = require("../../../controllers/academic/class.controller");

const allocateClass = protectedRoute("sis.class.allocate");

classRouter
  .route("/class-levels")
  .get([...allocateClass], getClassLevelsController)
  .post([...allocateClass], createClassLevelController);

classRouter
  .route("/class-levels/:id")
  .get([...allocateClass], getClassLevelController)
  .patch([...allocateClass], updateClassLevelController)
  .delete([...allocateClass], deleteClassLevelController);

module.exports = classRouter;
