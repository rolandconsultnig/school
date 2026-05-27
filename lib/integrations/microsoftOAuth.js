/**
 * Microsoft Entra ID / Azure AD OAuth2 (Module 0).
 */

const tenant = () => process.env.MICROSOFT_TENANT_ID || "common";
const MICROSOFT_AUTH = () =>
  `https://login.microsoftonline.com/${tenant()}/oauth2/v2.0/authorize`;
const MICROSOFT_TOKEN = () =>
  `https://login.microsoftonline.com/${tenant()}/oauth2/v2.0/token`;
const GRAPH_ME = "https://graph.microsoft.com/v1.0/me";

function isConfigured() {
  return !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET);
}

function redirectUri() {
  return (
    process.env.MICROSOFT_REDIRECT_URI ||
    "http://localhost:5340/api/v1/auth/microsoft/callback"
  );
}

function buildAuthorizeUrl(state) {
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid email profile User.Read",
    response_mode: "query",
    state: state || "schoolportal",
  });
  return `${MICROSOFT_AUTH()}?${params.toString()}`;
}

async function exchangeCode(code) {
  const res = await fetch(MICROSOFT_TOKEN(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.MICROSOFT_CLIENT_ID,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error_description || json.error || "Token exchange failed");
  }
  return json;
}

async function fetchProfile(accessToken) {
  const res = await fetch(GRAPH_ME, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || "Profile fetch failed");
  return {
    email: json.mail || json.userPrincipalName,
    name: json.displayName,
  };
}

module.exports = {
  isConfigured,
  redirectUri,
  buildAuthorizeUrl,
  exchangeCode,
  fetchProfile,
};
