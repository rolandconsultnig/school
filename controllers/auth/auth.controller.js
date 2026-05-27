const responseStatus = require("../../handlers/responseStatus.handler");
const {
  unifiedLoginService,
  ssoStatusService,
  ssoNotConfiguredService,
  loginByEmailService,
} = require("../../services/auth/auth.service");
const googleOAuth = require("../../lib/integrations/googleOAuth");
const microsoftOAuth = require("../../lib/integrations/microsoftOAuth");

exports.unifiedLoginController = async (req, res) => {
  try {
    await unifiedLoginService(req.body, res);
  } catch (e) {
    responseStatus(res, 400, "failed", e.message);
  }
};

exports.ssoStatusController = (_req, res) => {
  res.status(200).json({ status: "success", data: ssoStatusService() });
};

exports.googleSsoStartController = (req, res) => {
  if (!googleOAuth.isConfigured()) {
    return ssoNotConfiguredService("Google", res);
  }
  const state = req.query.returnUrl
    ? Buffer.from(String(req.query.returnUrl)).toString("base64url")
    : "schoolportal";
  return res.redirect(googleOAuth.buildAuthorizeUrl(state));
};

exports.googleSsoCallbackController = async (req, res) => {
  try {
    if (!googleOAuth.isConfigured()) {
      return ssoNotConfiguredService("Google", res);
    }
    const { code } = req.query;
    if (!code) return responseStatus(res, 400, "failed", "Missing OAuth code");

    const tokens = await googleOAuth.exchangeCode(code);
    const profile = await googleOAuth.fetchProfile(tokens.access_token);
    const frontend =
      process.env.FRONTEND_URL || "http://localhost:5345";
    const returnPath = req.query.state && req.query.state !== "schoolportal"
      ? Buffer.from(String(req.query.state), "base64url").toString("utf8")
      : "/";

    const mockRes = {
      statusCode: 200,
      body: null,
      status(c) {
        this.statusCode = c;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };
    await loginByEmailService(profile.email, mockRes);
    if (mockRes.statusCode !== 200 || mockRes.body?.status !== "success") {
      const msg = mockRes.body?.message || "SSO login failed";
      return res.redirect(
        `${frontend}/login?sso_error=${encodeURIComponent(msg)}`
      );
    }
    const data = mockRes.body.data;
    const token = encodeURIComponent(data.token);
    const profileType = encodeURIComponent(data.profileType);
    return res.redirect(
      `${frontend}/login?sso_token=${token}&profile_type=${profileType}&return=${encodeURIComponent(returnPath)}`
    );
  } catch (e) {
    const frontend = process.env.FRONTEND_URL || "http://localhost:5345";
    return res.redirect(
      `${frontend}/login?sso_error=${encodeURIComponent(e.message)}`
    );
  }
};

exports.microsoftSsoStartController = (req, res) => {
  if (!microsoftOAuth.isConfigured()) {
    return ssoNotConfiguredService("Microsoft", res);
  }
  const state = req.query.returnUrl
    ? Buffer.from(String(req.query.returnUrl)).toString("base64url")
    : "schoolportal";
  return res.redirect(microsoftOAuth.buildAuthorizeUrl(state));
};

exports.microsoftSsoCallbackController = async (req, res) => {
  try {
    if (!microsoftOAuth.isConfigured()) {
      return ssoNotConfiguredService("Microsoft", res);
    }
    const { code } = req.query;
    if (!code) return responseStatus(res, 400, "failed", "Missing OAuth code");

    const tokens = await microsoftOAuth.exchangeCode(code);
    const profile = await microsoftOAuth.fetchProfile(tokens.access_token);
    const frontend = process.env.FRONTEND_URL || "http://localhost:5345";
    const returnPath =
      req.query.state && req.query.state !== "schoolportal"
        ? Buffer.from(String(req.query.state), "base64url").toString("utf8")
        : "/";

    const mockRes = {
      statusCode: 200,
      body: null,
      status(c) {
        this.statusCode = c;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };
    await loginByEmailService(profile.email, mockRes);
    if (mockRes.statusCode !== 200 || mockRes.body?.status !== "success") {
      const msg = mockRes.body?.message || "SSO login failed";
      return res.redirect(`${frontend}/login?sso_error=${encodeURIComponent(msg)}`);
    }
    const data = mockRes.body.data;
    const token = encodeURIComponent(data.token);
    const profileType = encodeURIComponent(data.profileType);
    return res.redirect(
      `${frontend}/login?sso_token=${token}&profile_type=${profileType}&return=${encodeURIComponent(returnPath)}`
    );
  } catch (e) {
    const frontend = process.env.FRONTEND_URL || "http://localhost:5345";
    return res.redirect(
      `${frontend}/login?sso_error=${encodeURIComponent(e.message)}`
    );
  }
};
