import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { admissionsApi } from "../../api/client";
import { clearApplicant, loadApplicant } from "../../lib/applicantAuth";
import { recordId, type ApiRecord } from "../../types";

export function ApplyPortalPage() {
  const session = loadApplicant();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!session?.token) return;
    admissionsApi
      .applicantPortal(session.token)
      .then((p) => setProfile(p as Record<string, unknown>))
      .catch((e) => setError(String(e.message ?? e)));
  }, [session?.token]);

  if (!session) return <Navigate to="/apply/login" replace />;

  async function uploadDoc(e: FormEvent) {
    e.preventDefault();
    const token = session?.token;
    if (!file || !token) return;
    setError("");
    setMsg("");
    try {
      await admissionsApi.applicantUploadDocument(token, file, title);
      setMsg("Document uploaded.");
      setTitle("");
      setFile(null);
      const p = await admissionsApi.applicantPortal(token);
      setProfile(p as Record<string, unknown>);
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  const documents = (profile?.documents as ApiRecord[]) ?? [];

  return (
    <div className="login-page">
      <div className="login-panel" style={{ maxWidth: 640, margin: "2rem auto", width: "100%" }}>
        <div className="login-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>Applicant portal</h2>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                clearApplicant();
                window.location.href = "/apply/login";
              }}
            >
              Sign out
            </button>
          </div>
          <p className="subtitle">Welcome, {session.name || session.email}</p>
          {error && <div className="error-banner">{error}</div>}
          {msg && <p style={{ color: "var(--primary)" }}>{msg}</p>}
          {profile && (
            <div className="card" style={{ marginTop: "1rem" }}>
              <p>
                <strong>Status:</strong> {String(profile.status ?? "—")}
              </p>
              <p>
                <strong>Tier:</strong> {String(profile.tier ?? "—")}
              </p>
            </div>
          )}
          <form onSubmit={uploadDoc} style={{ marginTop: "1rem" }}>
            <h3>Upload document</h3>
            <div className="form-group">
              <label>Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>File</label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
              />
            </div>
            <button type="submit" className="btn">
              Upload
            </button>
          </form>
          <div style={{ marginTop: "1.5rem" }}>
            <h3>Your documents ({documents.length})</h3>
            <ul>
              {documents.map((d) => (
                <li key={recordId(d)}>
                  <a href={String(d.fileUrl)} target="_blank" rel="noreferrer">
                    {String(d.title)}
                  </a>{" "}
                  — {String(d.status ?? "pending")}
                </li>
              ))}
            </ul>
            {documents.length === 0 && <p className="empty">No documents yet</p>}
          </div>
          <p style={{ marginTop: "1.5rem", fontSize: "0.85rem" }}>
            <Link to="/apply">New inquiry</Link> · <Link to="/login">Staff login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
