import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { studentsApi } from "../api/client";
import { useApiContext } from "../context/TenantContext";
import { recordId, type ApiRecord } from "../types";

export function StudentsPage() {
  const ctx = useApiContext();
  const [students, setStudents] = useState<ApiRecord[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ctx.token) return;
    studentsApi
      .list(ctx.token, ctx.campusId, ctx.tier)
      .then((data) => setStudents(data as ApiRecord[]))
      .catch((e) => setError(String(e.message ?? e)))
      .finally(() => setLoading(false));
  }, [ctx.token, ctx.campusId, ctx.tier]);

  return (
    <div>
      <div className="page-header">
        <h1>Students</h1>
      </div>
      {error && <div className="error-banner">{error}</div>}
      <div className="card table-wrap">
        {loading ? (
          <p className="empty">Loading…</p>
        ) : students.length === 0 ? (
          <p className="empty">No students found for this campus/tier.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Student ID</th>
                <th>Tier</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={recordId(s)}>
                  <td>{String(s.name)}</td>
                  <td>{String(s.email)}</td>
                  <td>{String(s.studentId ?? "—")}</td>
                  <td>
                    <span className="badge">{String(s.tier ?? "—")}</span>
                  </td>
                  <td>
                    <Link to={`/students/${recordId(s)}`}>Profile</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
