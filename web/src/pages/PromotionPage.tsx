import { FormEvent, useEffect, useState } from "react";
import {
  classesApi,
  foundationApi,
  sisExtendedApi,
  studentsApi,
} from "../api/client";
import { useApiContext } from "../context/TenantContext";
import { PageHeader } from "../components/PageHeader";
import { recordId, type ApiRecord } from "../types";

export function PromotionPage() {
  const ctx = useApiContext();
  const [grades, setGrades] = useState<ApiRecord[]>([]);
  const [classes, setClasses] = useState<ApiRecord[]>([]);
  const [students, setStudents] = useState<ApiRecord[]>([]);
  const [fromGradeId, setFromGradeId] = useState("");
  const [classLevelId, setClassLevelId] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [graduateFinalYear, setGraduateFinalYear] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    foundationApi.gradesByTier(ctx.tier).then((g) => {
      setGrades(g as ApiRecord[]);
      if (g[0]) setFromGradeId(recordId(g[0] as ApiRecord));
    });
    classesApi.list(ctx.token, ctx.campusId, ctx.tier).then((c) => {
      setClasses(c as ApiRecord[]);
      if (c[0]) setClassLevelId(recordId(c[0] as ApiRecord));
    });
    studentsApi
      .list(ctx.token, ctx.campusId, ctx.tier)
      .then((s) => setStudents(s as ApiRecord[]));
  }, [ctx.token, ctx.campusId, ctx.tier]);

  async function runPromotion(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      const result = await sisExtendedApi.runPromotion(
        ctx.token,
        {
          tier: ctx.tier,
          campusId: ctx.campusId,
          fromGradeLevelId: fromGradeId,
          repeaterStudentIds: selectedIds,
          graduateFinalYear,
        },
        ctx.campusId,
        ctx.tier
      );
      setMsg(`Promotion complete: ${JSON.stringify(result)}`);
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  async function assignClass(e: FormEvent) {
    e.preventDefault();
    if (!selectedIds.length) {
      setError("Select at least one student for class assignment.");
      return;
    }
    setError("");
    setMsg("");
    try {
      await sisExtendedApi.assignClass(
        ctx.token,
        { classLevelId, studentIds: selectedIds },
        ctx.campusId,
        ctx.tier
      );
      setMsg(`Assigned ${selectedIds.length} student(s) to class.`);
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  function toggleStudent(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div>
      <PageHeader
        title="Promotion & class assign"
        subtitle={`Tier: ${ctx.tier} — end-of-year promotion and bulk class placement`}
      />
      {error && <div className="error-banner">{error}</div>}
      {msg && (
        <div className="card" style={{ marginBottom: "1rem", color: "var(--primary)" }}>
          {msg}
        </div>
      )}
      <div className="grid-2">
        <form className="card" onSubmit={runPromotion}>
          <h3>Run promotion</h3>
          <div className="form-group">
            <label>From grade level</label>
            <select
              value={fromGradeId}
              onChange={(e) => setFromGradeId(e.target.value)}
              required
            >
              {grades.map((g) => (
                <option key={recordId(g)} value={recordId(g)}>
                  {String(g.name ?? g.label)}
                </option>
              ))}
            </select>
          </div>
          <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={graduateFinalYear}
              onChange={(e) => setGraduateFinalYear(e.target.checked)}
            />
            Graduate final-year students
          </label>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
            Mark repeaters below, then run promotion for everyone else in the grade.
          </p>
          <button type="submit" className="btn" style={{ marginTop: "1rem" }}>
            Run promotion
          </button>
        </form>
        <form className="card" onSubmit={assignClass}>
          <h3>Mass assign class</h3>
          <div className="form-group">
            <label>Target class</label>
            <select
              value={classLevelId}
              onChange={(e) => setClassLevelId(e.target.value)}
              required
            >
              {classes.map((c) => (
                <option key={recordId(c)} value={recordId(c)}>
                  {String(c.name)}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn">
            Assign selected ({selectedIds.length})
          </button>
        </form>
      </div>
      <div className="card table-wrap" style={{ marginTop: "1rem" }}>
        <h3>Students — select for repeaters / class assign</h3>
        <table>
          <thead>
            <tr>
              <th />
              <th>Name</th>
              <th>Student ID</th>
              <th>Tier</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const id = recordId(s);
              return (
                <tr key={id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(id)}
                      onChange={() => toggleStudent(id)}
                    />
                  </td>
                  <td>{String(s.name)}</td>
                  <td>{String(s.studentId ?? "—")}</td>
                  <td>{String(s.tier ?? "")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
