import { useEffect, useState } from "react";
import { admissionsActionsApi, admissionsApi } from "../api/client";
import { useApiContext } from "../context/TenantContext";
import { recordId, type ApiRecord } from "../types";

export function AdmissionsPage() {
  const ctx = useApiContext();
  const [inquiries, setInquiries] = useState<ApiRecord[]>([]);
  const [applicants, setApplicants] = useState<ApiRecord[]>([]);
  const [tab, setTab] = useState<"inquiries" | "applicants">("inquiries");
  const [selectedApplicant, setSelectedApplicant] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewScore, setInterviewScore] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  function load() {
    Promise.all([
      admissionsApi.inquiries(ctx.token, ctx.campusId, ctx.tier),
      admissionsApi.applicants(ctx.token, ctx.campusId, ctx.tier),
    ])
      .then(([i, a]) => {
        setInquiries(i as ApiRecord[]);
        setApplicants(a as ApiRecord[]);
        if (a[0] && !selectedApplicant) setSelectedApplicant(recordId(a[0] as ApiRecord));
      })
      .catch((e) => setError(String(e.message ?? e)));
  }

  useEffect(() => {
    load();
  }, [ctx.token, ctx.campusId, ctx.tier]);

  async function setStatus(id: string, status: string) {
    setMsg("");
    setError("");
    try {
      await admissionsActionsApi.updateStatus(
        ctx.token,
        id,
        status,
        ctx.campusId,
        ctx.tier
      );
      setMsg(`Applicant marked ${status}.`);
      load();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  async function enroll(id: string) {
    setMsg("");
    setError("");
    try {
      const result = await admissionsActionsApi.enroll(
        ctx.token,
        id,
        {},
        ctx.campusId,
        ctx.tier
      );
      const r = result as Record<string, unknown>;
      setMsg(
        `Enrolled as student. Temp password may be in API response: ${String(r.temporaryPassword ?? "check email")}`
      );
      load();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  async function scheduleInterview() {
    if (!selectedApplicant || !interviewDate) return;
    setError("");
    try {
      await admissionsActionsApi.scheduleInterview(
        ctx.token,
        selectedApplicant,
        new Date(interviewDate).toISOString(),
        ctx.campusId,
        ctx.tier
      );
      setMsg("Interview scheduled.");
      load();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  async function saveInterviewScore() {
    if (!selectedApplicant) return;
    setError("");
    try {
      await admissionsActionsApi.recordInterviewScore(
        ctx.token,
        selectedApplicant,
        {
          interviewScore: Number(interviewScore),
          interviewNotes,
        },
        ctx.campusId,
        ctx.tier
      );
      setMsg("Interview score saved.");
      load();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  const rows = tab === "inquiries" ? inquiries : applicants;

  return (
    <div>
      <div className="page-header">
        <h1>Admissions</h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            className={tab === "inquiries" ? "btn" : "btn btn-secondary"}
            onClick={() => setTab("inquiries")}
          >
            Inquiries ({inquiries.length})
          </button>
          <button
            type="button"
            className={tab === "applicants" ? "btn" : "btn btn-secondary"}
            onClick={() => setTab("applicants")}
          >
            Applicants ({applicants.length})
          </button>
        </div>
      </div>
      {error && <div className="error-banner">{error}</div>}
      {msg && (
        <div className="card" style={{ marginBottom: "1rem", color: "var(--primary)" }}>
          {msg}
        </div>
      )}
      {tab === "applicants" && (
        <div className="card grid-2" style={{ marginBottom: "1rem", display: "grid" }}>
          <div>
            <h3>Interview scheduling</h3>
            <div className="form-group">
              <label>Applicant</label>
              <select
                value={selectedApplicant}
                onChange={(e) => setSelectedApplicant(e.target.value)}
              >
                {applicants.map((a) => (
                  <option key={recordId(a)} value={recordId(a)}>
                    {String(a.name ?? a.email)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Interview date & time</label>
              <input
                type="datetime-local"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
              />
            </div>
            <button type="button" className="btn btn-secondary" onClick={scheduleInterview}>
              Schedule interview
            </button>
          </div>
          <div>
            <h3>Interview score</h3>
            <div className="form-group">
              <label>Score (0–100)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={interviewScore}
                onChange={(e) => setInterviewScore(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={interviewNotes}
                onChange={(e) => setInterviewNotes(e.target.value)}
                rows={2}
              />
            </div>
            <button type="button" className="btn btn-secondary" onClick={saveInterviewScore}>
              Save score
            </button>
          </div>
        </div>
      )}
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              {tab === "applicants" && <th>Interview</th>}
              {tab === "applicants" && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={recordId(r)}>
                <td>{String(r.name ?? r.fullName ?? `${r.firstName ?? ""} ${r.lastName ?? ""}`)}</td>
                <td>{String(r.email)}</td>
                <td>
                  <span className="badge">{String(r.status ?? "—")}</span>
                </td>
                {tab === "applicants" && (
                  <td style={{ fontSize: "0.85rem" }}>
                    {r.interviewDate
                      ? String(r.interviewDate).slice(0, 16)
                      : "—"}
                    {r.interviewScore != null && ` · ${r.interviewScore}%`}
                  </td>
                )}
                {tab === "applicants" && (
                  <td style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                    {r.status !== "ACCEPTED" && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setStatus(recordId(r), "ACCEPTED")}
                      >
                        Accept
                      </button>
                    )}
                    {r.status === "ACCEPTED" && !r.enrolledStudentId && (
                      <button
                        type="button"
                        className="btn"
                        onClick={() => enroll(recordId(r))}
                      >
                        Enroll
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="empty">No records</p>}
      </div>
    </div>
  );
}
