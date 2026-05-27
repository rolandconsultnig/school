import { useEffect, useState } from "react";
import { lmsApi } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { PageHeader } from "../../components/PageHeader";

export function StudentGradebookPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.token) return;
    lmsApi
      .studentGradebook(user.token)
      .then((g) => setData(g as Record<string, unknown>))
      .catch((e) => setError(String((e as Error).message)));
  }, [user?.token]);

  const courses = (data?.courses as Record<string, unknown>[]) ?? [];

  return (
    <div>
      <PageHeader
        title="Interactive gradebook"
        subtitle="Scores per assignment, exam averages, and weighting toward your overall mark"
      />
      {error && <div className="error-banner">{error}</div>}
      {courses.map((c, i) => {
        const assignments = (c.assignments as Record<string, unknown>[]) ?? [];
        const examAvg = c.examAverage;
        const assignmentScores = assignments.filter((a) => a.score != null);
        const assignAvg =
          assignmentScores.length > 0
            ? assignmentScores.reduce(
                (s, a) => s + (Number(a.score) / Number(a.maxScore || 100)) * 100,
                0
              ) / assignmentScores.length
            : null;
        const overall =
          examAvg != null && assignAvg != null
            ? ((Number(examAvg) + assignAvg) / 2).toFixed(1)
            : examAvg != null
              ? Number(examAvg).toFixed(1)
              : assignAvg != null
                ? assignAvg.toFixed(1)
                : "—";

        return (
          <div key={i} className="card" style={{ marginBottom: "1rem" }}>
            <h3>{String(c.title)}</h3>
            <p style={{ color: "var(--muted)" }}>
              Exam weight (avg): {examAvg != null ? Number(examAvg).toFixed(1) : "—"}% ·
              Coursework weight (avg):{" "}
              {assignAvg != null ? assignAvg.toFixed(1) : "—"}% ·{" "}
              <strong>Combined estimate: {overall}%</strong>
            </p>
            <table>
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a, j) => (
                  <tr key={j}>
                    <td>{String(a.title)}</td>
                    <td>
                      {a.score != null
                        ? `${a.score}/${a.maxScore}`
                        : "—"}
                    </td>
                    <td>{String(a.status ?? "pending")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
      {courses.length === 0 && !error && (
        <p className="empty">No grade data yet — enroll in published courses first.</p>
      )}
    </div>
  );
}
