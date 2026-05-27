const express = require("express");
const yearGroupRouter = express.Router();
const protectedRoute = require("../../../middlewares/protectedRoute");
const manage = protectedRoute("lms.course.manage");
const {
  getYearGroupsController,
  createYearGroupController,
  getYearGroupController,
  updateYearGroupController,
  deleteYearGroupController,
} = require("../../../controllers/academic/yearGroup.controller");

yearGroupRouter
  .route("/year-group")
  .get([...manage], getYearGroupsController)
  .post([...manage], createYearGroupController);

yearGroupRouter
  .route("/year-group/:id")
  .get([...manage], getYearGroupController)
  .patch([...manage], updateYearGroupController)
  .delete([...manage], deleteYearGroupController);

module.exports = yearGroupRouter;
