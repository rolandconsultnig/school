const express = require("express");
const {
  bootstrapAdminController,
  registerAdminController,
  loginAdminController,
  getAdminsController,
  updateAdminController,
  deleteAdminController,
  adminSuspendTeacherController,
  adminUnSuspendTeacherController,
  adminWithdrawTeacherController,
  adminUnWithdrawTeacherController,
  adminPublishResultsController,
  adminUnPublishResultsController,
  getAdminProfileController,
} = require("../../../controllers/staff/admin.controller");
const isAdmin = require("../../../middlewares/isAdmin");
const protectedRoute = require("../../../middlewares/protectedRoute");

const adminRouter = express.Router();
const adminAuth = protectedRoute();
const hrManage = protectedRoute("hr.staff.manage");
const gradePublish = protectedRoute("lms.grade.publish");

// First-time bootstrap (no admins in DB)
adminRouter.route("/admin/setup").post(bootstrapAdminController);

adminRouter.route("/admin/login").post(loginAdminController);

adminRouter
  .route("/admin/register")
  .post([...adminAuth, isAdmin], registerAdminController);

adminRouter.route("/admins").get([...adminAuth, isAdmin], getAdminsController);

adminRouter.route("/admin/profile").get([...adminAuth], getAdminProfileController);

adminRouter
  .route("/admin/:id")
  .put([...adminAuth, isAdmin], updateAdminController)
  .delete([...adminAuth, isAdmin], deleteAdminController);

adminRouter
  .route("/admins/suspend/teacher/:id")
  .put([...hrManage], adminSuspendTeacherController);

adminRouter
  .route("/admins/unsuspend/teacher/:id")
  .put([...hrManage], adminUnSuspendTeacherController);

adminRouter
  .route("/admins/withdraw/teacher/:id")
  .put([...hrManage], adminWithdrawTeacherController);

adminRouter
  .route("/admins/unwithdraw/teacher/:id")
  .put([...hrManage], adminUnWithdrawTeacherController);

adminRouter
  .route("/admins/publish/result/:id")
  .put([...gradePublish], adminPublishResultsController);

adminRouter
  .route("/admins/unpublish/result/:id")
  .put([...gradePublish], adminUnPublishResultsController);

module.exports = adminRouter;
