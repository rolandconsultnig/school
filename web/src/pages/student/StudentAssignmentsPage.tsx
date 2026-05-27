import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { studentPortalApi } from "../../api/studentPortal";
import { useAuth } from "../../context/AuthContext";
import { recordId, type ApiRecord } from "../../types";
import { PageHeader } from "../../components/PageHeader";

export function StudentAssignmentsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ApiRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.token) return;
    studentPortalApi
      .assignments(user.token)
      .then((a) => setRows(a as ApiRecord[]))
      .catch((e) => setError(String((e as Error).message)));
  }, [user?.token]);

  const now = Date.now();
  const upcoming = rows.filter((r) => {
    const due = r.dueAt ? new Date(String(r.dueAt)).getTime() : 0;
    return due >= now && r.status === "PENDING";
  });
  const submitted = rows.filter((r) => r.status && r.status !== "PENDING");
  const graded = rows.filter((r) => r.score != null);

  return (
    <div>
      <PageHeader title="Assignments" subtitle="Upcoming, submitted, and graded work" />
      {error && <div className="error-banner">{error}</div>}
      <div className="grid-2">
        <div className="card">
          <h3>Due soon ({upcoming.length})</h3>
          {upcoming.length === 0 ? (
            <p className="empty">No pending deadlines</p>
          ) : (
            <ul>
              {upcoming.map((a) => (
                <li key={recordId(a)} style={{ marginBottom: "0.5rem" }}>
                  <strong>{String(a.title)}</strong> — {String(a.courseTitle)}
                  <br />
                  <small>Due {String(a.dueAt ?? "").slice(0, 16)}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <h3>Graded ({graded.length})</h3>
          {graded.length === 0 ? (
            <p className="empty">No grades yet</p>
          ) : (
            <ul>
              {graded.map((a) => (
                <li key={recordId(a)}>
                  {String(a.title)}: {String(a.score)}/{String(a.maxScore)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <p style={{ marginTop: "1rem" }}>
        <Link to="/learn/courses" className="btn btn-secondary">
          Open a course to submit work
        </Link>
      </p>
      {submitted.length > 0 && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <h3>Submitted ({submitted.length})</h3>
          <ul>
            {submitted.map((a) => (
              <li key={recordId(a)}>
                {String(a.title)} — <span className="badge">{String(a.status)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
