const express = require("express");
const authRouter = express.Router();
const validateBody = require("../../../middlewares/validateBody");
const { loginSchema } = require("../../../lib/validation/login.schema");
const {
  unifiedLoginController,
  ssoStatusController,
  googleSsoStartController,
  googleSsoCallbackController,
  microsoftSsoStartController,
  microsoftSsoCallbackController,
} = require("../../../controllers/auth/auth.controller");

authRouter.post("/auth/login", validateBody(loginSchema), unifiedLoginController);
authRouter.get("/auth/sso/status", ssoStatusController);
authRouter.get("/auth/google/start", googleSsoStartController);
authRouter.get("/auth/google/callback", googleSsoCallbackController);
authRouter.get("/auth/microsoft/start", microsoftSsoStartController);
authRouter.get("/auth/microsoft/callback", microsoftSsoCallbackController);

module.exports = authRouter;
