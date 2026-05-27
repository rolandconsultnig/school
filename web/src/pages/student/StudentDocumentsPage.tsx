import { FormEvent, useEffect, useState } from "react";
import { studentPortalApi } from "../../api/studentPortal";
import { useAuth } from "../../context/AuthContext";
import { PageHeader } from "../../components/PageHeader";
import { recordId, type ApiRecord } from "../../types";

const TYPES = [
  { value: "TRANSCRIPT", label: "Official transcript" },
  { value: "ENROLLMENT_VERIFICATION", label: "Enrollment verification" },
  { value: "CHARACTER_CERTIFICATE", label: "Character certificate" },
];

export function StudentDocumentsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ApiRecord[]>([]);
  const [type, setType] = useState("TRANSCRIPT");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  function load() {
    if (!user?.token) return;
    studentPortalApi
      .documentRequests(user.token)
      .then((r) => setRequests(r as ApiRecord[]))
      .catch((e) => setError(String((e as Error).message)));
  }

  useEffect(() => {
    load();
  }, [user?.token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user?.token) return;
    setMsg("");
    try {
      await studentPortalApi.createDocumentRequest(user.token, { type, notes });
      setMsg("Request submitted — records office will notify you.");
      setNotes("");
      load();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  return (
    <div>
      <PageHeader title="Official documents" subtitle="Request electronic certificates" />
      {error && <div className="error-banner">{error}</div>}
      {msg && (
        <div className="card" style={{ marginBottom: "1rem", color: "var(--primary)" }}>
          {msg}
        </div>
      )}
      <form className="card" onSubmit={onSubmit} style={{ marginBottom: "1rem" }}>
        <div className="form-group">
          <label>Document type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Notes (optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>
        <button type="submit" className="btn">
          Submit request
        </button>
      </form>
      <div className="card table-wrap">
        <h3>Your requests</h3>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={recordId(r)}>
                <td>{String(r.type)}</td>
                <td>
                  <span className="badge">{String(r.status)}</span>
                </td>
                <td>{String(r.createdAt ?? "").slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {requests.length === 0 && <p className="empty">No requests yet</p>}
      </div>
    </div>
  );
}
