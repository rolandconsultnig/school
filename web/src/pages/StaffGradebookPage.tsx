import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { lmsApi } from "../api/client";
import { useApiContext } from "../context/TenantContext";
import { PageHeader } from "../components/PageHeader";
import { recordId, type ApiRecord } from "../types";

export function StaffGradebookPage() {
  const ctx = useApiContext();
  const [courses, setCourses] = useState<ApiRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ctx.token) return;
    lmsApi
      .courses(ctx.token, ctx.campusId, ctx.tier)
      .then((c) => setCourses(c as ApiRecord[]))
      .catch((e) => setError(String(e.message ?? e)));
  }, [ctx.token, ctx.campusId, ctx.tier]);

  return (
    <div>
      <PageHeader
        title="Gradebook"
        subtitle="Open a course to view and manage student grades"
      />
      {error && <div className="error-banner">{error}</div>}
      <div className="grid-2">
        {courses.map((c) => (
          <div key={recordId(c)} className="card">
            <h3>{String(c.title ?? c.name)}</h3>
            <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
              {String(c.subjectName ?? "—")} · {String(c.classLevelName ?? "—")}
            </p>
            <Link to={`/lms/${recordId(c)}`} className="btn btn-secondary" style={{ marginTop: "0.75rem" }}>
              Open gradebook
            </Link>
          </div>
        ))}
      </div>
      {courses.length === 0 && !error && (
        <p className="empty">No LMS courses — create one under LMS first.</p>
      )}
    </div>
  );
}
