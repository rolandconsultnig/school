import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { lmsApi } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { PageHeader } from "../../components/PageHeader";
import { recordId, type ApiRecord } from "../../types";

export function StudentCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<ApiRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.token) return;
    lmsApi
      .studentCourses(user.token)
      .then((c) => setCourses(c as ApiRecord[]))
      .catch((e) => setError(String((e as Error).message)));
  }, [user?.token]);

  return (
    <div>
      <PageHeader title="My courses" subtitle="Subjects you are enrolled in" />
      {error && <div className="error-banner">{error}</div>}
      <div className="grid-2">
        {courses.map((c) => {
          const progress = Number(c.progressPercent ?? 0);
          const teacher = c.teacher as ApiRecord | undefined;
          return (
            <Link
              key={recordId(c)}
              to={`/learn/courses/${recordId(c)}`}
              className="card course-card"
            >
              <h3>{String(c.title)}</h3>
              <p style={{ color: "var(--muted)", margin: "0.25rem 0" }}>
                {String((c.subject as ApiRecord)?.name ?? "Subject")} ·{" "}
                {String(teacher?.name ?? c.teacherName ?? "Teacher")}
              </p>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <small style={{ color: "var(--muted)" }}>{progress}% complete</small>
            </Link>
          );
        })}
      </div>
      {courses.length === 0 && !error && (
        <p className="empty">No courses yet — ask your teacher to enroll you.</p>
      )}
    </div>
  );
}
