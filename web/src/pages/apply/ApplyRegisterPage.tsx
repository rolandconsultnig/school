import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { admissionsApi } from "../../api/client";
import { loadApplicant, saveApplicant } from "../../lib/applicantAuth";
import { recordId, type ApiRecord, type SchoolTier } from "../../types";

export function ApplyRegisterPage() {
  const navigate = useNavigate();
  const existing = loadApplicant();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tier, setTier] = useState<SchoolTier>("PRIMARY");
  const [error, setError] = useState("");

  if (existing) return <Navigate to="/apply/portal" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await admissionsApi.registerApplicant({
        firstName,
        lastName,
        email,
        password,
        tier,
      });
      const a = res.applicant as ApiRecord;
      saveApplicant({
        token: res.token,
        email: String(a.email),
        name: `${firstName} ${lastName}`,
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
          <h2>Applicant registration</h2>
          {error && <div className="error-banner">{error}</div>}
          <div className="form-group">
            <label>First name</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Last name</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
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
          <div className="form-group">
            <label>Tier applying for</label>
            <select value={tier} onChange={(e) => setTier(e.target.value as SchoolTier)}>
              <option value="NURSERY">Nursery</option>
              <option value="PRIMARY">Primary</option>
              <option value="SECONDARY">Secondary</option>
            </select>
          </div>
          <button type="submit" className="btn" style={{ width: "100%" }}>
            Create account
          </button>
          <p style={{ marginTop: "1rem", fontSize: "0.85rem" }}>
            <Link to="/apply/login">Sign in</Link> · <Link to="/apply">Inquiry</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
