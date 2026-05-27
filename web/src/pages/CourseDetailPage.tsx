import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { lmsApi } from "../api/client";
import { useApiContext } from "../context/TenantContext";
import { useAuth } from "../context/AuthContext";
import { recordId, type ApiRecord } from "../types";

export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { isStudent } = useAuth();
  const ctx = useApiContext();
  const [course, setCourse] = useState<Record<string, unknown> | null>(null);
  const [gradebook, setGradebook] = useState<Record<string, unknown> | null>(null);
  const [assignTitle, setAssignTitle] = useState("");
  const [error, setError] = useState("");

  function load() {
    if (!courseId) return;
    lmsApi
      .course(ctx.token, courseId, ctx.campusId, ctx.tier)
      .then((c) => setCourse(c as Record<string, unknown>))
      .catch((e) => setError(String(e.message ?? e)));
    if (!isStudent) {
      lmsApi
        .gradebook(ctx.token, courseId, ctx.campusId, ctx.tier)
        .then((g) => setGradebook(g as Record<string, unknown>))
        .catch(() => {});
    }
  }

  useEffect(() => {
    load();
  }, [courseId, ctx.token]);

  async function addAssignment(e: FormEvent) {
    e.preventDefault();
    if (!courseId) return;
    await lmsApi.createAssignment(
      ctx.token,
      courseId,
      { title: assignTitle, isPublished: true, maxScore: 100 },
      ctx.campusId,
      ctx.tier
    );
    setAssignTitle("");
    load();
  }

  if (!course) return <p className="empty">Loading…</p>;

  const assignments = (course.assignments as ApiRecord[]) ?? [];
  const liveSessions = (course.liveSessions as ApiRecord[]) ?? [];
  const students = (gradebook?.students as unknown[]) ?? [];

  return (
    <div>
      <div className="page-header">
        <h1>{String(course.title)}</h1>
      </div>
      {error && <div className="error-banner">{error}</div>}
      <div className="grid-2">
        <div className="card">
          <h3>Assignments ({assignments.length})</h3>
          <ul>
            {assignments.map((a) => (
              <li key={recordId(a)}>{String(a.title)}</li>
            ))}
          </ul>
          {!isStudent && (
            <form onSubmit={addAssignment} style={{ marginTop: "1rem" }}>
              <input
                placeholder="New assignment title"
                value={assignTitle}
                onChange={(e) => setAssignTitle(e.target.value)}
                required
              />
              <button type="submit" className="btn" style={{ marginTop: "0.5rem" }}>
                Add
              </button>
            </form>
          )}
        </div>
        <div className="card">
          <h3>Live sessions</h3>
          {liveSessions.length === 0 ? (
            <p className="empty">None scheduled</p>
          ) : (
            <ul>
              {liveSessions.map((s) => (
                <li key={recordId(s)}>
                  <a href={String(s.meetingUrl)} target="_blank" rel="noreferrer">
                    {String(s.title)}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {!isStudent && students.length > 0 && (
        <div className="card table-wrap" style={{ marginTop: "1rem" }}>
          <h3>Gradebook</h3>
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Exam avg</th>
                <th>Assignment avg</th>
                <th>Overall %</th>
              </tr>
            </thead>
            <tbody>
              {students.map((row, i) => {
                const r = row as Record<string, unknown>;
                const st = r.student as ApiRecord;
                return (
                  <tr key={i}>
                    <td>{String(st?.name)}</td>
                    <td>{r.examAverage != null ? Number(r.examAverage).toFixed(1) : "—"}</td>
                    <td>
                      {r.assignmentAverage != null
                        ? Number(r.assignmentAverage).toFixed(1)
                        : "—"}
                    </td>
                    <td>
                      {r.overallPercent != null
                        ? `${Number(r.overallPercent).toFixed(1)}%`
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
