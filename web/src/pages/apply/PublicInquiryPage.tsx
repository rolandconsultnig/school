import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { admissionsApi } from "../../api/client";
import type { SchoolTier } from "../../types";

export function PublicInquiryPage() {
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [studentName, setStudentName] = useState("");
  const [message, setMessage] = useState("");
  const [tier, setTier] = useState<SchoolTier>("PRIMARY");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await admissionsApi.createInquiry({
        parentName,
        parentEmail,
        parentPhone: parentPhone || undefined,
        studentName,
        message: message || undefined,
        tier,
      });
      setDone(true);
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  if (done) {
    return (
      <div className="login-page">
        <div className="login-panel" style={{ maxWidth: 480, margin: "2rem auto" }}>
          <div className="login-card">
            <h2>Thank you</h2>
            <p>Your inquiry was received. The admissions office will contact you shortly.</p>
            <p style={{ marginTop: "1rem" }}>
              <Link to="/apply/register">Create an applicant account</Link> to upload documents.
            </p>
            <Link to="/apply/login" className="btn" style={{ display: "inline-block", marginTop: "1rem" }}>
              Applicant login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-panel" style={{ maxWidth: 520, margin: "2rem auto" }}>
        <form className="login-card" onSubmit={onSubmit}>
          <h2>Admission inquiry</h2>
          <p className="subtitle">Public form — no login required</p>
          {error && <div className="error-banner">{error}</div>}
          <div className="form-group">
            <label>Parent / guardian name</label>
            <input value={parentName} onChange={(e) => setParentName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Student name</label>
            <input value={studentName} onChange={(e) => setStudentName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Tier</label>
            <select value={tier} onChange={(e) => setTier(e.target.value as SchoolTier)}>
              <option value="NURSERY">Nursery</option>
              <option value="PRIMARY">Primary</option>
              <option value="SECONDARY">Secondary</option>
            </select>
          </div>
          <div className="form-group">
            <label>Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
          </div>
          <button type="submit" className="btn" style={{ width: "100%" }}>
            Submit inquiry
          </button>
          <p style={{ marginTop: "1rem", fontSize: "0.85rem" }}>
            Already applied? <Link to="/apply/login">Sign in</Link> ·{" "}
            <Link to="/apply/register">Register</Link> · <Link to="/login">Staff login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
