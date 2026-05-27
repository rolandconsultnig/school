import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { admissionsApi } from "../../api/client";
import { loadApplicant, saveApplicant } from "../../lib/applicantAuth";
import { recordId, type ApiRecord } from "../../types";

export function ApplyLoginPage() {
  const navigate = useNavigate();
  const existing = loadApplicant();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (existing) return <Navigate to="/apply/portal" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await admissionsApi.applicantLogin(email, password);
      const a = res.applicant as ApiRecord;
      saveApplicant({
        token: res.token,
        email: String(a.email),
        name: `${String(a.firstName ?? "")} ${String(a.lastName ?? "")}`.trim(),
        applicantId: recordId(a),
      });
      navigate("/apply/portal");
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  return (
    <div className="login-page">
      <div className="login-panel" style={{ maxWidth: 420, margin: "2rem auto" }}>
        <form className="login-card" onSubmit={onSubmit}>
          <h2>Applicant login</h2>
          {error && <div className="error-banner">{error}</div>}
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn" style={{ width: "100%" }}>
            Continue
          </button>
          <p style={{ marginTop: "1rem", fontSize: "0.85rem" }}>
            <Link to="/apply/register">Register</Link> · <Link to="/apply">Inquiry</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
