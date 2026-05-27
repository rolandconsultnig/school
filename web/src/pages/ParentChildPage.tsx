import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { parentApi, analyticsApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { PageHeader } from "../components/PageHeader";
import type { ApiRecord } from "../types";

export function ParentChildPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.token || !studentId) return;
    parentApi
      .childSummary(user.token, studentId)
      .then((d) => setData(d as Record<string, unknown>))
      .catch((e) => setError(String((e as Error).message)));
  }, [user?.token, studentId]);

  const student = data?.student as Record<string, unknown> | undefined;
  const fees = (data?.fees as ApiRecord[]) ?? [];
  const results = (data?.results as ApiRecord[]) ?? [];
  const reportCards = (data?.reportCards as ApiRecord[]) ?? [];

  async function printReport(reportCardId: string) {
    if (!user?.token) return;
    const html = await analyticsApi.reportCardHtml(user.token, reportCardId);
    const blob = new Blob([html], { type: "text/html" });
    window.open(URL.createObjectURL(blob), "_blank", "noopener");
  }

  return (
    <div>
      <PageHeader
        title={String(student?.name ?? "Child")}
        subtitle="Grades, fees, and attendance"
      />
      <Link to="/dashboard" className="btn btn-secondary" style={{ marginBottom: "1rem" }}>
        ← Back to dashboard
      </Link>
      {error && <div className="error-banner">{error}</div>}
      {data && (
        <div className="grid-2">
          <div className="card">
            <h3>Summary</h3>
            <p>Outstanding fees: ₦{Number(data.outstandingFees ?? 0).toLocaleString()}</p>
            <p>
              Attendance:{" "}
              {data.attendancePercent != null ? `${data.attendancePercent}%` : "—"}
            </p>
          </div>
          <div className="card">
            <h3>Recent results</h3>
            <ul>
              {results.map((r, i) => (
                <li key={i}>
                  {String(r.examName)} — {String(r.subjectName)}: {String(r.score)}
                </li>
              ))}
            </ul>
          </div>
          <div className="card table-wrap">
            <h3>Fee ledger</h3>
            <table>
              <thead>
                <tr>
                  <th>Fee</th>
                  <th>Due</th>
                  <th>Paid</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((f, i) => (
                  <tr key={i}>
                    <td>{String(f.feeName)}</td>
                    <td>₦{Number(f.amountDue ?? 0).toLocaleString()}</td>
                    <td>₦{Number(f.amountPaid ?? 0).toLocaleString()}</td>
                    <td>{String(f.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card">
            <h3>Report cards</h3>
            <ul>
              {reportCards.map((rc) => (
                <li key={String(rc.id)}>
                  {String(rc.createdAt ?? "").slice(0, 10)}{" "}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => printReport(String(rc.id))}
                  >
                    Print
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
