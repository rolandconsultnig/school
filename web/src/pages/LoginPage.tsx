import { FormEvent, useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError, authApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { withBase } from "../lib/basePath";
import type { ProfileType } from "../types";

export function LoginPage() {
  const { user, login, completeSso } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [email, setEmail] = useState("superadmin@school.local");
  const [password, setPassword] = useState("SuperAdmin@123");
  const [portal, setPortal] = useState<ProfileType | "STAFF">("STAFF");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [microsoftEnabled, setMicrosoftEnabled] = useState(false);

  useEffect(() => {
    authApi.ssoStatus().then((s) => {
      setGoogleEnabled(!!s.google?.enabled);
      setMicrosoftEnabled(!!s.microsoft?.enabled);
    });
  }, []);

  useEffect(() => {
    const ssoError = searchParams.get("sso_error");
    if (ssoError) {
      setError(decodeURIComponent(ssoError));
      setSearchParams({}, { replace: true });
      return;
    }
    const token = searchParams.get("sso_token");
    const profileType = searchParams.get("profile_type") as ProfileType | null;
    const returnTo = searchParams.get("return") || "/dashboard";
    if (token && profileType) {
      completeSso(token, profileType);
      setSearchParams({}, { replace: true });
      navigate(returnTo);
    }
  }, [searchParams, completeSso, navigate, setSearchParams]);

  if (user) return <Navigate to="/dashboard" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const p = portal === "STAFF" ? undefined : portal;
      await login(email, password, p);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-hero">
        <h1>SchoolPortal Nigeria</h1>
        <p>
          One platform for Nursery, Primary, and Secondary — admissions, SIS,
          attendance, LMS, and parent engagement.
        </p>
        <ul>
          <li>✓ Multi-campus & tier-aware (NURSERY · PRIMARY · SECONDARY)</li>
          <li>✓ Role-based dashboards for staff, students, and parents</li>
          <li>✓ Live API integration — no mock data</li>
        </ul>
      </div>
      <div className="login-panel">
        <form className="login-card" onSubmit={onSubmit}>
          <h2>Sign in</h2>
          <p className="subtitle">Choose your portal and use your school credentials</p>
          <div className="portal-tabs">
            {(["STAFF", "STUDENT", "PARENT"] as const).map((p) => (
              <button
                key={p}
                type="button"
                className={portal === p ? "active" : ""}
                onClick={() => setPortal(p)}
              >
                {p === "STAFF" ? "Staff" : p.charAt(0) + p.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          {error && <div className="error-banner">{error}</div>}
          {portal === "STAFF" && (googleEnabled || microsoftEnabled) && (
            <div style={{ marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {googleEnabled && (
                <a
                  href={withBase("/api/v1/auth/google/start")}
                  className="btn btn-secondary"
                  style={{ width: "100%", textAlign: "center", display: "block" }}
                >
                  Continue with Google
                </a>
              )}
              {microsoftEnabled && (
                <a
                  href={withBase("/api/v1/auth/microsoft/start")}
                  className="btn btn-secondary"
                  style={{ width: "100%", textAlign: "center", display: "block" }}
                >
                  Continue with Microsoft
                </a>
              )}
            </div>
          )}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Signing in…" : "Continue"}
          </button>
          <p style={{ marginTop: "1rem", fontSize: "0.85rem" }}>
            <a href={withBase("/")}>School website</a>
            {" · "}
            <a href={withBase("/apply")}>Admissions inquiry</a>
            {" · "}
            <a href={withBase("/apply/login")}>Applicant login</a>
          </p>
          <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--muted)" }}>
            {portal === "STAFF" && (
              <>
                Admin: superadmin@school.local / SuperAdmin@123
                <br />
                Teacher: teacher@school.local / Teacher@123
              </>
            )}
            {portal === "STUDENT" && <>Demo: student@school.local / Student@123</>}
            {portal === "PARENT" && <>Demo: parent@school.local / Parent@123</>}
          </p>
        </form>
      </div>
    </div>
  );
}
