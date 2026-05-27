import { FormEvent, useEffect, useState } from "react";
import { hrApi, teachersApi } from "../api/client";
import { useApiContext } from "../context/TenantContext";
import { recordId, type ApiRecord } from "../types";

export function HrPage() {
  const ctx = useApiContext();
  const [section, setSection] = useState<"leave" | "payroll" | "performance">("leave");
  const [reviews, setReviews] = useState<ApiRecord[]>([]);
  const [perfTeacherId, setPerfTeacherId] = useState("");
  const [perfPeriod, setPerfPeriod] = useState("");
  const [perfRating, setPerfRating] = useState("4");
  const [perfComments, setPerfComments] = useState("");
  const [requests, setRequests] = useState<ApiRecord[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<ApiRecord[]>([]);
  const [teachers, setTeachers] = useState<ApiRecord[]>([]);
  const [teacherId, setTeacherId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [periodLabel, setPeriodLabel] = useState("");
  const [selectedRun, setSelectedRun] = useState("");
  const [lineTeacherId, setLineTeacherId] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [deductions, setDeductions] = useState("0");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  function loadLeave() {
    hrApi
      .leaveRequests(ctx.token)
      .then((r) => setRequests(r as ApiRecord[]))
      .catch((e) => setError(String(e.message ?? e)));
  }

  function loadPerformance() {
    hrApi
      .performanceReviews(ctx.token)
      .then((r) => setReviews(r as ApiRecord[]))
      .catch((e) => setError(String(e.message ?? e)));
  }

  function loadPayroll() {
    const q: Record<string, string> = {};
    if (ctx.campusId) q.campusId = ctx.campusId;
    hrApi
      .payrollRuns(ctx.token, q)
      .then((r) => {
        setPayrollRuns(r as ApiRecord[]);
        if (r[0] && !selectedRun) setSelectedRun(recordId(r[0] as ApiRecord));
      })
      .catch((e) => setError(String(e.message ?? e)));
  }

  useEffect(() => {
    teachersApi.list(ctx.token).then((t) => {
      setTeachers(t as ApiRecord[]);
      if (t[0]) {
        const id = recordId(t[0] as ApiRecord);
        setTeacherId(id);
        setLineTeacherId(id);
      }
    });
    loadLeave();
    loadPayroll();
    loadPerformance();
  }, [ctx.token, ctx.campusId]);

  async function submitLeave(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      await hrApi.createLeave(ctx.token, {
        teacherId,
        startDate,
        endDate,
        reason,
      });
      setMsg("Leave request submitted.");
      loadLeave();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  async function review(id: string, status: string) {
    try {
      await hrApi.reviewLeave(ctx.token, id, { status });
      loadLeave();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  async function createPayrollRun(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      await hrApi.createPayrollRun(ctx.token, {
        campusId: ctx.campusId,
        periodLabel,
      });
      setPeriodLabel("");
      setMsg("Payroll run created.");
      loadPayroll();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  async function addLine(e: FormEvent) {
    e.preventDefault();
    if (!selectedRun) return;
    setError("");
    try {
      await hrApi.addPayrollLine(ctx.token, selectedRun, {
        teacherId: lineTeacherId,
        baseSalary: Number(baseSalary),
        deductions: Number(deductions),
      });
      setMsg("Pay line added.");
      loadPayroll();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  async function approveRun(status: string) {
    if (!selectedRun) return;
    try {
      await hrApi.approvePayrollRun(ctx.token, selectedRun, status);
      loadPayroll();
      setMsg(`Run marked ${status}.`);
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>HR</h1>
      </div>
      {error && <div className="error-banner">{error}</div>}
      {msg && (
        <div className="card" style={{ marginBottom: "1rem", color: "var(--primary)" }}>
          {msg}
        </div>
      )}
      <div className="portal-tabs" style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          className={section === "leave" ? "active" : ""}
          onClick={() => setSection("leave")}
        >
          Leave
        </button>
        <button
          type="button"
          className={section === "payroll" ? "active" : ""}
          onClick={() => setSection("payroll")}
        >
          Payroll
        </button>
        <button
          type="button"
          className={section === "performance" ? "active" : ""}
          onClick={() => setSection("performance")}
        >
          Performance
        </button>
      </div>

      {section === "performance" ? (
        <div className="grid-2">
          <form
            className="card"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await hrApi.createPerformanceReview(ctx.token, {
                  teacherId: perfTeacherId,
                  periodLabel: perfPeriod,
                  rating: Number(perfRating),
                  comments: perfComments,
                });
                setMsg("Performance review created.");
                loadPerformance();
              } catch (err) {
                setError(String((err as Error).message));
              }
            }}
          >
            <h3>New review</h3>
            <div className="form-group">
              <label>Teacher</label>
              <select value={perfTeacherId} onChange={(e) => setPerfTeacherId(e.target.value)} required>
                {teachers.map((t) => (
                  <option key={recordId(t)} value={recordId(t)}>
                    {String(t.name)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Period</label>
              <input value={perfPeriod} onChange={(e) => setPerfPeriod(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Rating (1–5)</label>
              <input type="number" min={1} max={5} value={perfRating} onChange={(e) => setPerfRating(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Comments</label>
              <textarea value={perfComments} onChange={(e) => setPerfComments(e.target.value)} rows={3} />
            </div>
            <button type="submit" className="btn">Save draft</button>
          </form>
          <div className="card table-wrap">
            <h3>Reviews</h3>
            <table>
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Period</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={recordId(r)}>
                    <td>{String(r.teacherName)}</td>
                    <td>{String(r.periodLabel)}</td>
                    <td>{String(r.rating ?? "—")}</td>
                    <td>{String(r.status)}</td>
                    <td>
                      {r.status === "DRAFT" && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() =>
                            hrApi
                              .updatePerformanceReview(ctx.token, recordId(r), {
                                status: "SUBMITTED",
                              })
                              .then(loadPerformance)
                          }
                        >
                          Submit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : section === "leave" ? (
        <div className="grid-2">
          <form className="card" onSubmit={submitLeave}>
            <h3>Request leave</h3>
            <div className="form-group">
              <label>Teacher</label>
              <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} required>
                {teachers.map((t) => (
                  <option key={recordId(t)} value={recordId(t)}>
                    {String(t.name)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>From</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>To</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Reason</label>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} required />
            </div>
            <button type="submit" className="btn">
              Submit
            </button>
          </form>
          <div className="card table-wrap">
            <h3>Requests</h3>
            <table>
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Dates</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={recordId(r)}>
                    <td>{String(r.teacherName)}</td>
                    <td>
                      {String(r.startDate ?? "").slice(0, 10)} —{" "}
                      {String(r.endDate ?? "").slice(0, 10)}
                    </td>
                    <td>
                      <span className="badge">{String(r.status)}</span>
                    </td>
                    <td>
                      {r.status === "PENDING" && (
                        <>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ marginRight: "0.25rem" }}
                            onClick={() => review(recordId(r), "APPROVED")}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => review(recordId(r), "REJECTED")}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid-2">
          <div>
            <form className="card" onSubmit={createPayrollRun} style={{ marginBottom: "1rem" }}>
              <h3>New payroll run</h3>
              <div className="form-group">
                <label>Period (e.g. May 2026)</label>
                <input
                  value={periodLabel}
                  onChange={(e) => setPeriodLabel(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn">
                Create run
              </button>
            </form>
            <form className="card" onSubmit={addLine}>
              <h3>Add pay line</h3>
              <div className="form-group">
                <label>Run</label>
                <select value={selectedRun} onChange={(e) => setSelectedRun(e.target.value)}>
                  {payrollRuns.map((r) => (
                    <option key={recordId(r)} value={recordId(r)}>
                      {String(r.periodLabel)} ({String(r.status)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Teacher</label>
                <select
                  value={lineTeacherId}
                  onChange={(e) => setLineTeacherId(e.target.value)}
                  required
                >
                  {teachers.map((t) => (
                    <option key={recordId(t)} value={recordId(t)}>
                      {String(t.name)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Base salary (₦)</label>
                <input
                  type="number"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Deductions (₦)</label>
                <input
                  type="number"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-secondary">
                Add line
              </button>
            </form>
          </div>
          <div className="card table-wrap">
            <h3>Payroll runs</h3>
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Status</th>
                  <th>Lines</th>
                  <th>Total net</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {payrollRuns.map((r) => (
                  <tr key={recordId(r)}>
                    <td>{String(r.periodLabel)}</td>
                    <td>
                      <span className="badge">{String(r.status)}</span>
                    </td>
                    <td>{String(r.lineCount ?? 0)}</td>
                    <td>₦{Number(r.totalNet ?? 0).toLocaleString()}</td>
                    <td>
                      {r.status === "DRAFT" && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setSelectedRun(recordId(r));
                            approveRun("APPROVED");
                          }}
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payrollRuns.length === 0 && <p className="empty">No payroll runs yet</p>}
          </div>
        </div>
      )}
    </div>
  );
}
