/**
 * Google OAuth2 for staff/student/parent login (Module 0).
 */

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO = "https://www.googleapis.com/oauth2/v2/userinfo";

function isConfigured() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function redirectUri() {
  return (
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:5340/api/v1/auth/google/callback"
  );
}

function buildAuthorizeUrl(state) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state: state || "schoolportal",
  });
  return `${GOOGLE_AUTH}?${params.toString()}`;
}

async function exchangeCode(code) {
  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error_description || "Token exchange failed");
  return json;
}

async function fetchProfile(accessToken) {
  const res = await fetch(GOOGLE_USERINFO, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || "Profile fetch failed");
  return json;
}

module.exports = {
  isConfigured,
  redirectUri,
  buildAuthorizeUrl,
  exchangeCode,
  fetchProfile,
};
