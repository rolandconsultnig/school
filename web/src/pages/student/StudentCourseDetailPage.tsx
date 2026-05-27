import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { studentPortalApi } from "../../api/studentPortal";
import { useAuth } from "../../context/AuthContext";
import { recordId, type ApiRecord } from "../../types";

export function StudentCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<Record<string, unknown> | null>(null);
  const [submitId, setSubmitId] = useState("");
  const [submitText, setSubmitText] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  function load() {
    if (!user?.token || !courseId) return;
    studentPortalApi
      .studentCourse(user.token, courseId)
      .then((c) => setCourse(c))
      .catch((e) => setError(String((e as Error).message)));
  }

  useEffect(() => {
    load();
  }, [user?.token, courseId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user?.token || !submitId) return;
    setMsg("");
    try {
      await studentPortalApi.submitAssignment(user.token, submitId, {
        contentText: submitText,
      });
      setMsg("Submitted — receipt recorded with timestamp.");
      setSubmitText("");
      load();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  if (!course) return <p className="empty">Loading…</p>;

  const assignments = (course.assignments as ApiRecord[]) ?? [];
  const liveSessions = (course.liveSessions as ApiRecord[]) ?? [];
  const progress = Number(course.progressPercent ?? 0);

  return (
    <div>
      <div className="page-header">
        <h1>{String(course.title)}</h1>
        <p style={{ color: "var(--muted)" }}>{String(course.description ?? "")}</p>
      </div>
      {error && <div className="error-banner">{error}</div>}
      {msg && (
        <div className="card" style={{ marginBottom: "1rem", color: "var(--primary)" }}>
          {msg}
        </div>
      )}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <strong>Course progress</strong>
        <div className="progress-track" style={{ marginTop: "0.5rem" }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <small>{progress}% of assignments submitted</small>
      </div>
      <div className="grid-2">
        <div className="card">
          <h3>Lesson & live sessions</h3>
          {liveSessions.length === 0 ? (
            <p className="empty">No live sessions scheduled</p>
          ) : (
            <ul>
              {liveSessions.map((s) => (
                <li key={recordId(s)} style={{ marginBottom: "0.5rem" }}>
                  <strong>{String(s.title)}</strong>
                  <br />
                  <small>{String(s.scheduledAt ?? "").slice(0, 16)}</small>
                  {!!s.meetingUrl && (
                    <>
                      <br />
                      <a href={String(s.meetingUrl)} target="_blank" rel="noreferrer">
                        Open virtual classroom
                      </a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "1rem" }}>
            Recorded lectures and PDFs are shared by your teacher via assignment links.
          </p>
        </div>
        <div className="card">
          <h3>Assignments</h3>
          <ul>
            {assignments.map((a) => {
              const sub = a.submission as ApiRecord | undefined;
              return (
                <li key={recordId(a)} style={{ marginBottom: "0.75rem" }}>
                  <strong>{String(a.title)}</strong>
                  <br />
                  <small>
                    Due {String(a.dueAt ?? "").slice(0, 10)} ·{" "}
                    {sub?.status ? String(sub.status) : "Not submitted"}
                    {sub?.score != null && ` · ${sub.score}/${a.maxScore}`}
                  </small>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <form className="card" onSubmit={onSubmit}>
        <h3>Assignment drop-box</h3>
        <div className="form-group">
          <label>Select assignment</label>
          <select value={submitId} onChange={(e) => setSubmitId(e.target.value)} required>
            <option value="">Choose…</option>
            {assignments.map((a) => (
              <option key={recordId(a)} value={recordId(a)}>
                {String(a.title)}
              </option>
            ))}
          </select>
        </div>
        <div className="drop-zone">
          <p>Paste your work or a link to your file (PDF, doc, code repo URL)</p>
          <textarea
            value={submitText}
            onChange={(e) => setSubmitText(e.target.value)}
            rows={4}
            style={{ width: "100%", marginTop: "0.5rem" }}
            required
          />
        </div>
        <button type="submit" className="btn" style={{ marginTop: "1rem" }}>
          Submit with timestamp
        </button>
      </form>
    </div>
  );
}
