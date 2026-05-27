import { useEffect, useState } from "react";
import { studentPortalApi } from "../../api/studentPortal";
import { useAuth } from "../../context/AuthContext";
import { PageHeader } from "../../components/PageHeader";
import { recordId, type ApiRecord } from "../../types";

export function StudentRegisterPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<ApiRecord[]>([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!user?.token) return;
    studentPortalApi
      .registration(user.token)
      .then((c) => setCourses(c as ApiRecord[]))
      .catch((e) => setError(String((e as Error).message)));
  }, [user?.token]);

  return (
    <div>
      <PageHeader
        title="Course registration"
        subtitle="Elective catalog — registration window managed by the registrar"
      />
      {error && <div className="error-banner">{error}</div>}
      {msg && (
        <div className="card" style={{ marginBottom: "1rem", color: "var(--primary)" }}>
          {msg}
        </div>
      )}
      <div className="grid-2">
        {courses.map((c) => (
          <div key={recordId(c)} className="card">
            <h3>{String(c.title)}</h3>
            <p style={{ color: "var(--muted)" }}>
              {String(c.teacherName)} · {String(c.seatsAvailable)} seats left
            </p>
            {c.isEnrolled ? (
              <span className="badge">Enrolled</span>
            ) : (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  setMsg(
                    "Self-registration requires registrar approval — contact your class teacher."
                  )
                }
              >
                Request seat
              </button>
            )}
          </div>
        ))}
      </div>
      {courses.length === 0 && !error && <p className="empty">No open courses</p>}
    </div>
  );
}
