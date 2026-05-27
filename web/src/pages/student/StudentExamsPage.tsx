import { useEffect, useState } from "react";
import { studentPortalApi } from "../../api/studentPortal";
import { useAuth } from "../../context/AuthContext";
import { PageHeader } from "../../components/PageHeader";
import { recordId, type ApiRecord } from "../../types";

export function StudentExamsPage() {
  const { user } = useAuth();
  const [exams, setExams] = useState<ApiRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.token) return;
    studentPortalApi
      .exams(user.token)
      .then((e) => setExams(e as ApiRecord[]))
      .catch((err) => setError(String((err as Error).message)));
  }, [user?.token]);

  return (
    <div>
      <PageHeader
        title="Quiz & examination center"
        subtitle="Published results — timed exams use the school exam writer when scheduled"
      />
      {error && <div className="error-banner">{error}</div>}
      <div className="card">
        <p style={{ color: "var(--muted)" }}>
          When your teacher opens a timed test, you will see a countdown and question
          navigator in the exam writer. Multiple-choice results appear here after
          publication.
        </p>
      </div>
      <div className="card table-wrap" style={{ marginTop: "1rem" }}>
        <table>
          <thead>
            <tr>
              <th>Exam</th>
              <th>Subject</th>
              <th>Score</th>
              <th>Grade</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((e) => (
              <tr key={recordId(e)}>
                <td>{String(e.examName ?? "—")}</td>
                <td>{String(e.subjectName ?? "—")}</td>
                <td>{String(e.score)}</td>
                <td>{String(e.grade ?? "—")}</td>
                <td>
                  <span className="badge">{String(e.status)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {exams.length === 0 && <p className="empty">No published exam results yet</p>}
      </div>
    </div>
  );
}
